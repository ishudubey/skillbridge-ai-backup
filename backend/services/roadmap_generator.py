import json

def generate_roadmap(user_skills, role):
    with open("backend/data/skills.json") as f:
        skills_db = json.load(f)

    required = skills_db.get(role, [])
    gaps = [s for s in required if s not in user_skills]

    roadmap = []

    for skill in gaps:
        roadmap.append({
            "skill": skill,
            "resources": f"Learn {skill} from YouTube/Coursera",
            "timeline": "2 weeks"
        })

    return roadmap