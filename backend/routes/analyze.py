from flask import Blueprint, request, jsonify
from services.resume_parser import extract_text
from services.roadmap_generator import generate_roadmap

from openai import OpenAI

# 🔐 ADD YOUR API KEY HERE
client = OpenAI(api_key="YOUR_API_KEY")

analyze_bp = Blueprint("analyze", __name__)

# 🧠 AI SKILL EXTRACTION
def extract_skills_ai(text):
    prompt = f"""
    Extract all technical skills from this resume text.
    Return only a comma-separated list.

    Resume:
    {text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    skills_text = response.choices[0].message.content

    skills = [s.strip().lower() for s in skills_text.split(",")]

    return skills


# 🚀 MAIN API
@analyze_bp.route("/", methods=["POST"])
def analyze():
    file = request.files.get("resume")
    role = request.form.get("role")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # 📄 Extract text
    text = extract_text(file)

    # 🧠 AI extraction
    skills = extract_skills_ai(text)

    # 🎯 Generate roadmap
    roadmap = generate_roadmap(skills, role)

    return jsonify({
        "skills": skills,
        "roadmap": roadmap
    })