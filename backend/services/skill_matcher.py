import json

def match_skills(text):
    with open("backend/data/skills.json") as f:
        skills_db = json.load(f)

    found_skills = []

    for role in skills_db:
        for skill in skills_db[role]:
            if skill in text:
                found_skills.append(skill)

    return list(set(found_skills))