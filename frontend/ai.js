// ═══════════════════════════════════════════════
//  ai.js  –  Local skill helpers + chatbot logic
// ═══════════════════════════════════════════════

// 🎯 KNOWN SKILLS (used for manual skill-input matching)
const knownSkills = [
  "python", "machine learning", "sql", "html", "css", "javascript",
  "react", "node.js", "deep learning", "tensorflow", "nlp",
  "networking", "linux", "data visualization", "excel",
  "cloud computing", "aws", "database", "api"
];


// ──────────────────────────────────────────────
// 📄 RESUME SKILL EXTRACTOR
//    Reads the PDF via the backend (/analyze/)
//    and auto-fills the skills input field.
//    (Tesseract removed — backend does this properly with Gemini AI)
// ──────────────────────────────────────────────
async function extractSkills() {

  const fileInput = document.getElementById("resumeUpload");

  if (!fileInput || fileInput.files.length === 0) {
    document.getElementById("output").innerHTML =
      "⚠️ Please upload a PDF resume first.";
    return;
  }

  const file = fileInput.files[0];
  const career = document.getElementById("career")?.value || "Unknown";

  document.getElementById("output").innerHTML = "⏳ Extracting skills from resume...";

  try {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("role", career);

    const res = await fetch("http://127.0.0.1:5000/analyze/", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    const skills = data.skills || [];

    // ✅ Auto-fill skills field based on current tab
    const formatted = skills.map(s => `${s}:intermediate`).join(", ");

    if (userType === "fresher") {
      document.getElementById("skills").value = formatted;
    } else {
      document.getElementById("skillsExp").value = formatted;
    }

    document.getElementById("output").innerHTML =
      `✅ <b>${skills.length} skills extracted</b> and filled in below. Click <b>Analyze Resume</b> for full roadmap.`;

  } catch (err) {
    console.error(err);
    document.getElementById("output").innerHTML =
      "❌ Could not extract skills. Make sure backend is running.";
  }
}


// ──────────────────────────────────────────────
// 🤖 LOCAL CHATBOT FALLBACK LOGIC
//    Used only when the backend /chat/ is unavailable.
//    The main sendMessage() in script.js calls backend first;
//    this is the offline fallback.
// ──────────────────────────────────────────────
function chatbotFallback(input) {

  input = input.toLowerCase();

  // Read current user skills
  const userInput = userType === "fresher"
    ? document.getElementById("skills").value
    : document.getElementById("skillsExp").value;

  const userSkills = {};
  if (userInput.trim()) {
    userInput.split(',').forEach(s => {
      let [skill, level] = s.split(':');
      skill = normalizeSkill(skill);
      level = (level || "intermediate").toLowerCase().trim();
      userSkills[skill] = level;
    });
  }

  // Keyword-based replies
  if (input.includes("python")) {
    return "With Python, you can explore Data Scientist, AI Engineer, or Backend Developer roles.";
  }
  if (input.includes("web")) {
    return "You can go for Frontend, Backend, or Full Stack roles. Focus on JavaScript + frameworks.";
  }
  if (input.includes("ai") || input.includes("machine learning")) {
    return "Focus on Python, ML, Deep Learning, and real-world projects to become an AI Engineer.";
  }
  if (input.includes("cyber")) {
    return "Cybersecurity needs Networking, Linux, and Ethical Hacking. Start with basics + labs.";
  }
  if (input.includes("career") || input.includes("best")) {
    if (Object.keys(userSkills).length === 0) {
      return "Enter your skills first so I can suggest a career path for you!";
    }
    let bestCareer = ""; let maxScore = 0;
    for (let career in careerSkills) {
      const score = calculateMatch(userSkills, careerSkills[career]);
      if (score > maxScore) { maxScore = score; bestCareer = career; }
    }
    const extra = userType === "experienced"
      ? ` Your ${parseInt(document.getElementById("experienceYears")?.value) || 0} years of experience is a big advantage!`
      : "";
    return `Based on your skills, <b>${bestCareer}</b> suits you best (${maxScore}% match).${extra}`;
  }
  if (input.includes("improve") || input.includes("learn")) {
    return "Focus on high-weight skills for your target role, build 2–3 real projects, and stay consistent.";
  }
  if (input.includes("roadmap")) {
    return "Start with basics → build small projects → learn advanced skills → apply for internships/jobs.";
  }

  return "I can help with career suggestions, skill gaps, and learning paths. Try asking: <i>'best career for me'</i>.";
}
