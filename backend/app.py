from dotenv import load_dotenv   # ✅ FIX 1: Import dotenv
load_dotenv()                    # ✅ FIX 2: Load .env BEFORE anything else

from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import os
import sqlite3
import hashlib
from google import genai

# ──────────────────────────────────────────────
# 🔐 Gemini client
# ──────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ✅ FIX 3: Validate API key at startup so you get a clear error
if not GOOGLE_API_KEY:
    raise EnvironmentError(
        "❌ GOOGLE_API_KEY not found. "
        "Make sure your .env file exists in the backend/ folder and contains:\n"
        "GOOGLE_API_KEY=your_actual_key_here"
    )

client = genai.Client(api_key=GOOGLE_API_KEY)

app = Flask(__name__)
CORS(app)   # Allow all origins (fine for hackathon; restrict later)

# ──────────────────────────────────────────────
# 🗄️  DATABASE SETUP  (SQLite – no extra setup!)
# ──────────────────────────────────────────────
DB_PATH = "skillbridge.db"

def get_db():
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables on first run."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT    NOT NULL,
                email      TEXT    UNIQUE NOT NULL,
                password   TEXT    NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

init_db()   # Always runs on startup – safe if tables already exist

def hash_pw(password: str) -> str:
    """SHA-256 hash the password."""
    return hashlib.sha256(password.encode()).hexdigest()


# ──────────────────────────────────────────────
# 🧠  In-memory state per user session
#     (simple approach – good for hackathon)
# ──────────────────────────────────────────────
chat_history = []

user_profile = {
    "skills": [],
    "role":   ""
}


# ══════════════════════════════════════════════
#  AUTH  ROUTES
# ══════════════════════════════════════════════

# 📝 REGISTER
@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json(silent=True) or {}
    name     = data.get("name",     "").strip()
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not name or not email or not password:
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if "@" not in email:
        return jsonify({"error": "Enter a valid email address."}), 400

    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                (name, email, hash_pw(password))
            )
            conn.commit()
        return jsonify({"message": "Account created successfully!"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "This email is already registered."}), 409


# 🔑 LOGIN
@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, name, email FROM users WHERE email = ? AND password = ?",
            (email, hash_pw(password))
        ).fetchone()

    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({
        "message": "Login successful",
        "name":    user["name"],
        "email":   user["email"]
    }), 200


# ══════════════════════════════════════════════
#  HELPER  FUNCTIONS
# ══════════════════════════════════════════════

def extract_text(file) -> str:
    """Extract raw text from uploaded PDF resume."""
    text = ""
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text.lower()
    except Exception as e:
        print("⚠️ PDF extract error:", e)
    return text


def extract_skills_ai(text: str) -> list:
    """Use Gemini to extract skills from resume text."""
    try:
        prompt = f"""
Extract all technical skills from this resume.
Return ONLY a comma-separated list of skill names. No extra text.

Resume:
{text[:3000]}
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        skills = [s.strip().lower() for s in response.text.split(",") if s.strip()]
        return skills

    except Exception as e:
        print("⚠️ Gemini skill extraction failed:", e)
        # Fallback: keyword match
        basics = ["python", "sql", "machine learning", "html", "css",
                  "javascript", "react", "node.js", "excel", "aws"]
        return [s for s in basics if s in text]


def generate_roadmap_ai(skills: list, role: str) -> str:
    """Use Gemini to generate a personalised learning roadmap."""
    try:
        prompt = f"""
You are an expert career mentor.

Target Career: {role}
Current Skills: {", ".join(skills) if skills else "None"}

Generate a clear, structured learning roadmap.

Format each item as:
📌 Skill Name
   • Why it matters
   • Best resource (1 line)
   • Estimated timeline

Keep it practical, beginner-friendly, and motivating.
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        print("⚠️ Gemini roadmap failed:", e)
        return "Focus on Python, SQL, and Machine Learning. Build 2–3 projects and deploy them."


# ══════════════════════════════════════════════
#  CORE  FEATURE  ROUTES
# ══════════════════════════════════════════════

# 📄 ANALYZE RESUME
@app.route("/analyze/", methods=["POST"])
def analyze():
    file = request.files.get("resume")
    role = request.form.get("role", "Unknown")

    if not file:
        return jsonify({"error": "No resume file uploaded."}), 400

    text   = extract_text(file)
    skills = extract_skills_ai(text)

    # Save to in-memory profile
    user_profile["skills"] = skills
    user_profile["role"]   = role

    roadmap = generate_roadmap_ai(skills, role)

    return jsonify({
        "skills":  skills,
        "roadmap": roadmap
    }), 200


# 🤖 CHATBOT
@app.route("/chat/", methods=["POST"])
def chat():
    data         = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Please ask something."})

    chat_history.append(f"User: {user_message}")

    try:
        history_snippet = "\n".join(chat_history[-8:])   # last 4 exchanges

        prompt = f"""
You are SkillBridge AI – a friendly, expert career mentor.

User's target role  : {user_profile["role"] or "Not set yet"}
User's current skills: {", ".join(user_profile["skills"]) or "Not analysed yet"}

Recent conversation:
{history_snippet}

Give a concise, personalised, actionable reply.
Suggest specific missing skills when relevant.
Avoid generic advice – be specific to this user's profile.
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        reply = response.text
        chat_history.append(f"AI: {reply}")

        return jsonify({"reply": reply}), 200

    except Exception as e:
        print("⚠️ Gemini chat failed:", e)
        return jsonify({
            "reply": "Focus on building real-world projects consistently – that's the fastest path forward!"
        }), 200


# ──────────────────────────────────────────────
# 🚀  RUN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print("✅ SkillBridge AI backend running at http://127.0.0.1:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
