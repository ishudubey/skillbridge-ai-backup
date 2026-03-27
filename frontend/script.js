// ═══════════════════════════════════════════════
//  script.js  –  Main app logic
// ═══════════════════════════════════════════════

// 🔧 Backend URL — change this ONE place when deploying
const BACKEND = "http://127.0.0.1:5000";

// 🌍 Global user type
let userType = "fresher";


// ──────────────────────────────────────────────
// 🚀 INIT on page load
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── Tab switching ──
  const fresherTab      = document.getElementById("fresherTab");
  const experiencedTab  = document.getElementById("experiencedTab");
  const slider          = document.getElementById("tabSlider");
  const fresherSection  = document.getElementById("fresherSection");
  const experiencedSection = document.getElementById("experiencedSection");

  fresherTab?.addEventListener("click", () => {
    userType = "fresher";
    slider.style.transform = "translateX(0%)";
    fresherTab.classList.add("active");
    experiencedTab.classList.remove("active");
    fresherSection.classList.remove("hidden");
    experiencedSection.classList.add("hidden");
  });

  experiencedTab?.addEventListener("click", () => {
    userType = "experienced";
    slider.style.transform = "translateX(100%)";
    experiencedTab.classList.add("active");
    fresherTab.classList.remove("active");
    experiencedSection.classList.remove("hidden");
    fresherSection.classList.add("hidden");
  });

  // ── Trending skills list ──
  const list = document.getElementById("trending");
  if (list && typeof trendingSkills !== "undefined") {
    list.innerHTML = "";
    trendingSkills.forEach(skill => {
      const li = document.createElement("li");
      li.innerText = "🔥 " + skill;
      list.appendChild(li);
    });
  }

  // ── Career dropdown ──
  const dropdown = document.getElementById("career");
  if (dropdown && typeof careerSkills !== "undefined") {
    dropdown.innerHTML = "";
    Object.keys(careerSkills).forEach(career => {
      const option = document.createElement("option");
      option.value = career;
      option.text  = career;
      dropdown.appendChild(option);
    });
  }

  // ── Enter key for chat ──
  document.getElementById("chatInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // ── Show welcome message in chatbox ──
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    chatBox.innerHTML = `<p><b>🤖 AI:</b> Hi! I'm your SkillBridge career mentor. Tell me your target career or ask anything about skill development!</p>`;
  }

});


// ──────────────────────────────────────────────
// 🔍 ANALYZE
//   Works in TWO modes:
//   1️⃣  Resume uploaded → sends to backend (Gemini AI)
//   2️⃣  No file → uses manually typed skills + shows local roadmap hint
// ──────────────────────────────────────────────
async function analyze() {

  const fileInput = document.getElementById("resumeUpload");
  const career    = document.getElementById("career")?.value || "Unknown";
  const output    = document.getElementById("output");

  // ── MODE 1: Resume file provided ──
  if (fileInput && fileInput.files.length > 0) {

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("role", career);

    output.innerHTML = "⏳ Analyzing your resume with AI...";

    try {
      const res = await fetch(`${BACKEND}/analyze/`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Auto-fill skills field from resume
      const formatted = (data.skills || []).map(s => `${s}:intermediate`).join(", ");
      if (userType === "fresher") {
        document.getElementById("skills").value = formatted;
      } else {
        document.getElementById("skillsExp").value = formatted;
      }

      output.innerHTML = `
        <h2>🎯 AI Analysis Result</h2>
        <h3>🧠 Detected Skills</h3>
        <p>${data.skills?.length ? data.skills.join(", ") : "No skills detected"}</p>
        <h3>📌 Personalized Roadmap</h3>
        <p style="white-space:pre-line;">${data.roadmap}</p>
      `;

      // Update chart
      _buildSkillChart(data.skills || [], career);

    } catch (err) {
      console.error(err);
      output.innerHTML = "❌ Backend connection failed. Make sure <b>python app.py</b> is running.";
    }

    return;
  }

  // ── MODE 2: No file — use typed skills ──
  const userInput = userType === "fresher"
    ? document.getElementById("skills")?.value
    : document.getElementById("skillsExp")?.value;

  if (!userInput || !userInput.trim()) {
    output.innerHTML = "⚠️ Please enter your skills or upload a PDF resume first.";
    return;
  }

  // Parse typed skills
  const userSkills = {};
  userInput.split(',').forEach(s => {
    const [skill, level] = s.split(':');
    userSkills[normalizeSkill(skill.trim())] = (level || "intermediate").trim();
  });

  // Local skill gap
  const required  = careerSkills[career] || {};
  const learned   = [];
  const remaining = [];

  for (let skill in required) {
    const reqLevel = required[skill].level || "beginner";
    if (userSkills[skill] && compareLevel(userSkills[skill], reqLevel)) {
      learned.push(skill);
    } else {
      remaining.push(skill);
    }
  }

  // Course suggestions for gaps
  let courseHtml = "";
  remaining.forEach(skill => {
    const courses = (typeof courseData !== "undefined" && courseData[skill]) || [];
    if (courses.length) {
      courseHtml += `<p>📚 <b>${skill}:</b> ${courses.join(" | ")}</p>`;
    }
  });

  output.innerHTML = `
    <h2>🎯 Skill Gap Analysis – ${career}</h2>
    <p style="color:#9CA3AF;font-size:13px;">💡 Tip: Upload your PDF resume for AI-powered Gemini analysis.</p>
    <h3>✅ Skills You Have</h3>
    <p>${learned.join(", ") || "None matched — try entering more skills!"}</p>
    <h3>📌 Skills to Learn</h3>
    <p>${remaining.join(", ") || "Great! You cover all required skills 🎉"}</p>
    ${courseHtml ? `<h3>🎓 Recommended Courses</h3>${courseHtml}` : ""}
  `;

  _buildSkillChart(Object.keys(userSkills), career);
}


// ──────────────────────────────────────────────
// 📊 BUILD SKILL CHART (internal helper)
// ──────────────────────────────────────────────
function _buildSkillChart(userSkillsList, career) {

  const ctx = document.getElementById("skillChart");
  if (!ctx || typeof Chart === "undefined") return;

  const required = careerSkills[career] || {};
  const labels   = Object.keys(required);

  const levelMap = { beginner: 35, intermediate: 65, advanced: 100 };

  const values = labels.map(skill => {
    const found = userSkillsList.find(s =>
      s.toLowerCase().includes(skill) || skill.includes(s.toLowerCase())
    );
    return found ? levelMap["intermediate"] : 20;
  });

  if (window.skillChartInstance) window.skillChartInstance.destroy();

  window.skillChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Your Level vs Required",
        data: values,
        backgroundColor: values.map(v =>
          v >= 65
            ? "rgba(34,211,238,0.7)"
            : "rgba(124,58,237,0.5)"
        ),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#fff" } }
      },
      scales: {
        x: { ticks: { color: "#cbd5f5" } },
        y: { beginAtZero: true, max: 100, ticks: { color: "#cbd5f5" } }
      }
    }
  });
}


// ──────────────────────────────────────────────
// 💡 SUGGEST CAREERS
// ──────────────────────────────────────────────
function suggestCareers() {

  const userInput = userType === "fresher"
    ? document.getElementById("skills")?.value
    : document.getElementById("skillsExp")?.value;

  const output = document.getElementById("output");

  if (!userInput || !userInput.trim()) {
    output.innerHTML = "⚠️ Enter your skills first.";
    return;
  }

  const userSkills = {};
  userInput.split(',').forEach(s => {
    userSkills[normalizeSkill(s.trim().split(':')[0])] = "intermediate";
  });

  const results = [];
  for (let career in careerSkills) {
    const score = calculateMatch(userSkills, careerSkills[career]);
    if (score > 0) results.push({ career, score });
  }
  results.sort((a, b) => b.score - a.score);

  let html = "<h2>💡 Suggested Careers</h2>";
  results.slice(0, 5).forEach((item, i) => {
    const bar = Math.round(item.score);
    html += `
      <div style="margin:10px 0;">
        <p style="margin:0 0 4px;"><b>${i + 1}. ${item.career}</b> — ${bar}% match</p>
        <div style="background:#1e293b;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${bar}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22D3EE);border-radius:6px;"></div>
        </div>
      </div>`;
  });

  output.innerHTML = html;
}


// ──────────────────────────────────────────────
// 🏆 RECOMMEND BEST CAREER
// ──────────────────────────────────────────────
function recommendCareer() {

  const userInput = userType === "fresher"
    ? document.getElementById("skills")?.value
    : document.getElementById("skillsExp")?.value;

  const output = document.getElementById("output");

  if (!userInput || !userInput.trim()) {
    output.innerHTML = "⚠️ Enter your skills first.";
    return;
  }

  const userSkills = {};
  userInput.split(',').forEach(s => {
    userSkills[normalizeSkill(s.trim().split(':')[0])] = "intermediate";
  });

  let best = ""; let max = 0;
  for (let career in careerSkills) {
    const score = calculateMatch(userSkills, careerSkills[career]);
    if (score > max) { max = score; best = career; }
  }

  const expNote = userType === "experienced"
    ? ` Your ${parseInt(document.getElementById("experienceYears")?.value) || 0} years of experience give you a real advantage!`
    : "";

  output.innerHTML = `
    <h2>🏆 Best Career Match</h2>
    <p style="font-size:18px;"><b>${best}</b></p>
    <p>${max}% match with your current skills.${expNote}</p>
    <div style="background:#1e293b;border-radius:8px;height:12px;margin-top:10px;overflow:hidden;">
      <div style="width:${max}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22D3EE);border-radius:8px;transition:width 1s;"></div>
    </div>
    <p style="color:#9CA3AF;font-size:13px;margin-top:12px;">
      💡 Upload your resume and click <b>Analyze Resume</b> for a detailed AI roadmap.
    </p>
  `;
}


// ──────────────────────────────────────────────
// 💬 SEND CHAT MESSAGE
//    Tries backend first → falls back to local logic
// ──────────────────────────────────────────────
async function sendMessage() {

  const inputField = document.getElementById("chatInput");
  const chatBox    = document.getElementById("chatBox");   // ✅ fixed capital B

  const message = inputField?.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  inputField.value  = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Show typing indicator
  const typingId = "typing_" + Date.now();
  chatBox.innerHTML += `<p id="${typingId}" style="color:#6B7280;"><i>🤖 AI is typing...</i></p>`;

  try {
    const res = await fetch(`${BACKEND}/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    document.getElementById(typingId)?.remove();

    if (!res.ok) throw new Error();

    const data = await res.json();
    chatBox.innerHTML += `<p><b>🤖 AI:</b> ${data.reply}</p>`;

  } catch {
    document.getElementById(typingId)?.remove();

    // ✅ Fallback to local logic if backend is down
    const fallback = typeof chatbotFallback === "function"
      ? chatbotFallback(message)
      : "Try asking about your career, skills, or learning path!";

    chatBox.innerHTML += `<p><b>🤖 AI:</b> ${fallback} <span style="color:#6B7280;font-size:11px;">(offline mode)</span></p>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}
