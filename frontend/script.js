// ═══════════════════════════════════════════════
//  script.js  —  Main app logic + offline mode
// ═══════════════════════════════════════════════

// 🔧 Change this ONE place when deploying
const BACKEND = "https://skillbridge-ai.onrender.com";  // ← your Render URL

// 🌍 Global user type
let userType = "fresher";

// 🔴 Offline mode flag
let _offlineMode = false;

// ──────────────────────────────────────────────
// 🚀 INIT
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── Tab switching ──
  const fresherTab         = document.getElementById("fresherTab");
  const experiencedTab     = document.getElementById("experiencedTab");
  const slider             = document.getElementById("tabSlider");
  const fresherSection     = document.getElementById("fresherSection");
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
      const option   = document.createElement("option");
      option.value   = career;
      option.text    = career;
      dropdown.appendChild(option);
    });
  }

  // ── Enter key for chat ──
  document.getElementById("chatInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // ── Welcome message ──
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    chatBox.innerHTML = `<p><b>🤖 AI:</b> Hi! I'm your SkillBridge career mentor. Enter your skills above or ask me anything about your career path!</p>`;
  }

  // ── Check if backend is reachable ──
  _checkBackend();
});


// ──────────────────────────────────────────────
// 🔌 BACKEND HEALTH CHECK
// ──────────────────────────────────────────────
async function _checkBackend() {
  try {
    const res = await fetch(`${BACKEND}/`, { method: "GET", signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      _offlineMode = false;
      console.log("✅ Backend connected.");
    } else {
      _goOffline();
    }
  } catch {
    _goOffline();
  }
}

function _goOffline() {
  _offlineMode = true;
  console.warn("⚠️ Backend unreachable — offline mode active.");

  // Show offline banner
  const existing = document.getElementById("offlineBanner");
  if (!existing) {
    const banner = document.createElement("div");
    banner.id = "offlineBanner";
    banner.innerHTML = `
      ⚠️ <b>Offline Mode</b> — Backend not reachable.
      Skill analysis, career matching and chatbot work locally.
      Resume AI and login require internet connection.
      <span onclick="document.getElementById('offlineBanner').remove()"
            style="float:right;cursor:pointer;font-size:18px;">✕</span>
    `;
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:rgba(251,146,60,0.15);
      border-bottom:1px solid rgba(251,146,60,0.4);
      color:#FB923C; padding:10px 20px; font-size:13px;
      backdrop-filter:blur(10px);
    `;
    document.body.prepend(banner);
  }
}


// ──────────────────────────────────────────────
// 🔍 ANALYZE
// ──────────────────────────────────────────────
async function analyze() {

  const fileInput = document.getElementById("resumeUpload");
  const career    = document.getElementById("career")?.value || "Unknown";
  const output    = document.getElementById("output");

  // MODE 1 — Resume uploaded + backend online → full AI analysis
  if (fileInput?.files.length > 0 && !_offlineMode) {

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("role", career);
    output.innerHTML = "⏳ Analyzing your resume with Gemini AI...";

    try {
      const res = await fetch(`${BACKEND}/analyze/`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();

      const formatted = (data.skills || []).map(s => `${s}:intermediate`).join(", ");
      document.getElementById(userType === "experienced" ? "skillsExp" : "skills").value = formatted;

      output.innerHTML = `
        <h2>🎯 AI Analysis Result</h2>
        <h3>🧠 Detected Skills</h3>
        <p>${data.skills?.length ? data.skills.join(", ") : "No skills detected"}</p>
        <h3>📌 Personalized Roadmap</h3>
        <p style="white-space:pre-line;">${data.roadmap}</p>
      `;

      _buildChart(data.skills || [], career);
      return;

    } catch {
      _goOffline();
    }
  }

  // MODE 2 — Typed skills or offline → local analysis
  const userInput = userType === "fresher"
    ? document.getElementById("skills")?.value
    : document.getElementById("skillsExp")?.value;

  if (!userInput || !userInput.trim()) {
    output.innerHTML = "⚠️ Please enter your skills above or upload a PDF resume.";
    return;
  }

  const userSkills = {};
  userInput.split(",").forEach(s => {
    const [skill, level] = s.split(":");
    if (skill) userSkills[normalizeSkill(skill.trim())] = (level || "intermediate").trim();
  });

  const required  = (typeof careerSkills !== "undefined" && careerSkills[career]) || {};
  const learned   = [];
  const remaining = [];

  for (const skill in required) {
    const req = required[skill];
    if (userSkills[skill] && (typeof compareLevel === "function" ? compareLevel(userSkills[skill], req.level) : true)) {
      learned.push(skill);
    } else {
      remaining.push(skill);
    }
  }

  let courseHtml = "";
  remaining.forEach(skill => {
    const courses = typeof courseData !== "undefined" && courseData[skill];
    if (courses?.length) courseHtml += `<p>📚 <b>${skill}:</b> ${courses.join(" | ")}</p>`;
  });

  output.innerHTML = `
    <h2>🎯 Skill Gap Analysis — ${career}</h2>
    ${_offlineMode ? '<p style="color:#FB923C;font-size:12px;">⚠️ Offline mode — upload resume when online for AI roadmap</p>' : ''}
    <h3>✅ Skills You Have</h3>
    <p>${learned.join(", ") || "None matched yet — try entering more skills!"}</p>
    <h3>📌 Skills to Learn</h3>
    <p>${remaining.join(", ") || "You cover all required skills! 🎉"}</p>
    ${courseHtml ? `<h3>🎓 Recommended Courses</h3>${courseHtml}` : ""}
  `;

  _buildChart(Object.keys(userSkills), career);
}


// ──────────────────────────────────────────────
// 📊 BUILD CHART
// ──────────────────────────────────────────────
function _buildChart(userSkillsList, career) {
  const ctx = document.getElementById("skillChart");
  if (!ctx || typeof Chart === "undefined") return;

  const required = (typeof careerSkills !== "undefined" && careerSkills[career]) || {};
  const labels   = Object.keys(required);
  const levelMap = { beginner: 35, intermediate: 65, advanced: 100 };

  const values = labels.map(skill => {
    const found = userSkillsList.find(s =>
      s.toLowerCase().includes(skill) || skill.includes(s.toLowerCase())
    );
    return found ? 65 : 20;
  });

  if (window.skillChartInstance) window.skillChartInstance.destroy();

  window.skillChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Your Level vs Required",
        data: values,
        backgroundColor: values.map(v => v >= 65 ? "rgba(34,211,238,0.7)" : "rgba(124,58,237,0.5)"),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#fff" } } },
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

  if (!userInput?.trim()) {
    output.innerHTML = "⚠️ Enter your skills first.";
    return;
  }

  const userSkills = {};
  userInput.split(",").forEach(s => {
    userSkills[normalizeSkill(s.trim().split(":")[0])] = "intermediate";
  });

  const results = [];
  for (const career in careerSkills) {
    const score = calculateMatch(userSkills, careerSkills[career]);
    if (score > 0) results.push({ career, score });
  }
  results.sort((a, b) => b.score - a.score);

  let html = "<h2>💡 Suggested Careers</h2>";
  results.slice(0, 5).forEach((item, i) => {
    html += `
      <div style="margin:10px 0;">
        <p style="margin:0 0 4px;"><b>${i + 1}. ${item.career}</b> — ${item.score}% match</p>
        <div style="background:#1e293b;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${item.score}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22D3EE);border-radius:6px;"></div>
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

  if (!userInput?.trim()) {
    output.innerHTML = "⚠️ Enter your skills first.";
    return;
  }

  const userSkills = {};
  userInput.split(",").forEach(s => {
    userSkills[normalizeSkill(s.trim().split(":")[0])] = "intermediate";
  });

  let best = ""; let max = 0;
  for (const career in careerSkills) {
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
      <div style="width:${max}%;height:100%;background:linear-gradient(90deg,#7C3AED,#22D3EE);border-radius:8px;"></div>
    </div>
    <p style="color:#9CA3AF;font-size:13px;margin-top:12px;">
      💡 Upload your resume and click <b>Analyze Resume</b> for a detailed AI roadmap.
    </p>
  `;
}


// ──────────────────────────────────────────────
// 💬 SEND CHAT MESSAGE
//    Backend online  → Gemini AI (personalized)
//    Backend offline → Smart local fallback
// ──────────────────────────────────────────────
async function sendMessage() {

  const inputField = document.getElementById("chatInput");
  const chatBox    = document.getElementById("chatBox");
  const message    = inputField?.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  inputField.value   = "";

  // Typing indicator
  const tid = "t" + Date.now();
  chatBox.innerHTML += `<p id="${tid}" style="color:#6B7280;font-style:italic;">🤖 typing...</p>`;
  chatBox.scrollTop  = chatBox.scrollHeight;

  // Try backend first
  if (!_offlineMode) {
    try {
      const res = await fetch(`${BACKEND}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(8000)
      });

      document.getElementById(tid)?.remove();

      if (res.ok) {
        const data = await res.json();
        chatBox.innerHTML += `<p><b>🤖 AI:</b> ${data.reply}</p>`;
        chatBox.scrollTop  = chatBox.scrollHeight;
        return;
      }
    } catch {
      _goOffline();
    }
  }

  // Offline fallback
  document.getElementById(tid)?.remove();
  const reply = typeof chatbotFallback === "function"
    ? chatbotFallback(message)
    : "Ask me about career paths, skill gaps, or roadmaps!";

  chatBox.innerHTML += `<p><b>🤖 AI:</b> ${reply} <span style="color:#6B7280;font-size:11px;">(offline)</span></p>`;
  chatBox.scrollTop  = chatBox.scrollHeight;
}
