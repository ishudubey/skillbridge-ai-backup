from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import os
import hashlib
import psycopg2
import psycopg2.extras
from google import genai

# ──────────────────────────────────────────────
# 🔐 Gemini client
# ──────────────────────────────────────────────
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

app = Flask(__name__)
CORS(app)

# ──────────────────────────────────────────────
# 🗄️  NEON POSTGRESQL  (never resets on Render)
# ──────────────────────────────────────────────
# Set this env variable on Render dashboard:
#   DATABASE_URL = postgresql://user:pass@host/dbname?sslmode=require
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    """Open a connection to Neon PostgreSQL."""
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    return conn

def init_db():
    """Create tables if they don't exist (runs every startup — safe)."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id         SERIAL PRIMARY KEY,
                        name       TEXT    NOT NULL,
                        email      TEXT    UNIQUE NOT NULL,
                        password   TEXT    NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            conn.commit()
        print("✅ Database connected and tables ready.")
    except Exception as e:
        print(f"⚠️ Database init error: {e}")

init_db()

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ──────────────────────────────────────────────
# 🧠 In-memory user profile (per session)
# ──────────────────────────────────────────────
chat_history = []
user_profile  = { "skills": [], "role": "" }


# ══════════════════════════════════════════════
#  AUTH ROUTES
# ══════════════════════════════════════════════

@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json(silent=True) or {}
    name     = data.get("name",     "").strip()
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if "@" not in email:
        return jsonify({"error": "Enter a valid email address."}), 400

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
                    (name, email, hash_pw(password))
                )
            conn.commit()
        return jsonify({"message": "Account created successfully!"}), 201

    except psycopg2.errors.UniqueViolation:
        return jsonify({"error": "This email is already registered."}), 409
    except Exception as e:
        print("Register error:", e)
        return jsonify({"error": "Server error. Please try again."}), 500


@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    "SELECT name, email FROM users WHERE email = %s AND password = %s",
                    (email, hash_pw(password))
                )
                user = cur.fetchone()

        if not user:
            return jsonify({"error": "Invalid email or password."}), 401

        return jsonify({
            "message": "Login successful",
            "name":    user["name"],
            "email":   user["email"]
        }), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Server error. Please try again."}), 500


# ══════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════

def extract_text(file) -> str:
    text = ""
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t.lower()
    except Exception as e:
        print("PDF error:", e)
    return text


def extract_skills_ai(text: str) -> list:
    try:
        prompt = f"""
Extract all technical skills from this resume.
Return ONLY a comma-separated list. No extra text, no numbering.

Resume:
{text[:3000]}
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )
        return [s.strip().lower() for s in response.text.split(",") if s.strip()]
    except Exception as e:
        print("Gemini skill extract error:", e)
        basics = ["python", "sql", "machine learning", "html", "css",
                  "javascript", "react", "node.js", "excel", "aws"]
        return [s for s in basics if s in text]


def generate_roadmap_ai(skills: list, role: str) -> str:
    try:
        prompt = f"""
You are an expert career mentor.

Target Career : {role}
Current Skills: {", ".join(skills) if skills else "None"}

Generate a clear, structured learning roadmap.

Format each item as:
📌 Skill Name
   • Why it matters for {role}
   • Best free resource (1 line)
   • Estimated time

Keep it practical, specific, and beginner-friendly.
Maximum 6 items.
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini roadmap error:", e)
        return f"Focus on the core skills for {role}. Build projects, deploy them, and stay consistent."


# ══════════════════════════════════════════════
#  CORE FEATURE ROUTES
# ══════════════════════════════════════════════

@app.route("/analyze/", methods=["POST"])
def analyze():
    file = request.files.get("resume")
    role = request.form.get("role", "Unknown")

    if not file:
        return jsonify({"error": "No resume file uploaded."}), 400

    text    = extract_text(file)
    skills  = extract_skills_ai(text)
    user_profile["skills"] = skills
    user_profile["role"]   = role
    roadmap = generate_roadmap_ai(skills, role)

    return jsonify({ "skills": skills, "roadmap": roadmap }), 200


@app.route("/chat/", methods=["POST"])
def chat():
    data         = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Please ask something."})

    chat_history.append(f"User: {user_message}")

    try:
        prompt = f"""
You are SkillBridge AI — a friendly, expert career mentor for Indian students.

User's target role   : {user_profile["role"] or "Not set yet"}
User's current skills: {", ".join(user_profile["skills"]) or "Not analysed yet"}

Recent conversation:
{chr(10).join(chat_history[-8:])}

Rules:
- Give a DIFFERENT response each time — never repeat the same advice
- Be specific to this user's skill profile
- Keep it concise (3–5 lines max)
- Be encouraging but practical
- Mention specific tools, platforms, or resources when relevant
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )
        reply = response.text
        chat_history.append(f"AI: {reply}")
        return jsonify({"reply": reply}), 200

    except Exception as e:
        print("Gemini chat error:", e)
        return jsonify({
            "reply": "Build real projects consistently — that's the fastest path to any tech career!"
        }), 200


# ── Health check (Render needs this) ──────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "SkillBridge AI backend is running ✅"}), 200


if __name__ == "__main__":
    print("✅ SkillBridge AI backend running at http://127.0.0.1:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
