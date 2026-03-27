# ⚡ SkillBridge AI – Setup Guide

> AI-Powered Career Skill Gap Analyzer  
> Team InnovateX | India Innovates Hackathon 2026

---

## 📁 Project Structure

```
SKILLBRIDGE_AI/
│
├── backend/
│   ├── app.py               ← Main Flask server
│   ├── requirements.txt     ← All Python dependencies
│   └── data/
│       ├── skills.json
│       └── roles.json
│
├── frontend/
│   ├── login.html           ← Login / Register page (open this first)
│   ├── index.html           ← Main dashboard
│   ├── style.css
│   ├── script.js
│   ├── ai.js
│   ├── dashboard.js
│   └── data.js
│
└── README.md
```

---

## ✅ Requirements

Before starting, make sure you have:

- **Python 3.10 or above** → https://www.python.org/downloads/
- **VS Code** (recommended) → https://code.visualstudio.com/
- **Live Server extension** in VS Code
- **Google Gemini API Key** → https://aistudio.google.com

---

## 🚀 Step-by-Step Setup

### Step 1 — Open the project folder
Unzip the received folder. Open it in VS Code.

---

### Step 2 — Create Virtual Environment

Open terminal in VS Code (`Ctrl + ~`) and run:

```bash
cd backend
python -m venv venv
```

---

### Step 3 — Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line. ✅

---

### Step 4 — Install All Dependencies

```bash
pip install -r requirements.txt
```

Wait for everything to install. This takes 1–2 minutes.

---

### Step 5 — Set Your Gemini API Key

Get your free API key from: https://aistudio.google.com

**Windows:**
```bash
set GOOGLE_API_KEY=paste_your_key_here
```

**Mac/Linux:**
```bash
export GOOGLE_API_KEY=paste_your_key_here
```

---

### Step 6 — Start the Backend Server

```bash
python app.py
```

You should see:
```
✅ SkillBridge AI backend running at http://127.0.0.1:5000
```

Keep this terminal open. ✅

---

### Step 7 — Open the Frontend

1. Open VS Code
2. Install **Live Server** extension (if not installed)
3. Go to `frontend/` folder
4. Right-click `login.html` → **"Open with Live Server"**
5. Browser opens at `http://127.0.0.1:5500/login.html`

---

## 🎯 How to Use

1. **Register** a new account on the login page
2. **Login** → you'll be redirected to the dashboard
3. **Enter your skills** or upload a PDF resume
4. **Select your target career** from the dropdown
5. Click **Analyze Resume** → AI gives you a personalized roadmap
6. Use the **AI Career Mentor chatbot** at the bottom to ask questions

---

## ⚠️ Common Issues

| Problem | Solution |
|---|---|
| `pip` not recognized | Use `pip3` instead of `pip` |
| `python` not recognized | Use `python3` instead of `python` |
| Backend connection failed | Make sure `python app.py` is running in terminal |
| API key not working | Re-set it using `set GOOGLE_API_KEY=...` and restart |
| Port 5000 already in use | Restart your computer or kill the process using that port |

---

## 📞 Contact

For any issues during setup, contact the InnovateX team.
