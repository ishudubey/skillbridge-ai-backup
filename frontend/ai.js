// ═══════════════════════════════════════════════════════════
//  ai.js  —  Smart Offline AI  (never repeats, skill-aware)
// ═══════════════════════════════════════════════════════════

// ── Conversation memory ──────────────────────────────────────
const _mem = {
  usedResponses: new Set(),   // track every reply sent
  topicHistory:  [],          // last 6 topics
  turnCount:     0,
  lastCareer:    "",
  lastSkillTip:  {}           // per-career tip index
};

// ── Career roadmaps ──────────────────────────────────────────
const _roadmaps = {
  "Data Scientist":        ["Python basics", "Statistics & Math", "Pandas & NumPy", "SQL", "Scikit-learn (ML)", "Data Visualization", "Kaggle Projects", "Deploy a model"],
  "Web Developer":         ["HTML & CSS", "JavaScript ES6+", "Git & GitHub", "React or Vue", "Node.js basics", "REST APIs", "Deploy on Vercel", "Build 3 projects"],
  "AI Engineer":           ["Python + Math", "Machine Learning", "Deep Learning", "TensorFlow/PyTorch", "NLP basics", "Model deployment", "Open source contrib", "Apply"],
  "Cybersecurity Analyst": ["Networking fundamentals", "Linux basics", "TryHackMe labs", "Ethical Hacking", "Security+ cert", "CTF competitions", "Apply"],
  "Data Analyst":          ["Excel advanced", "SQL mastery", "Python Pandas", "Power BI / Tableau", "3 dashboards", "Statistics basics", "Apply"],
  "Frontend Developer":    ["HTML & CSS", "JavaScript ES6+", "React", "Git & GitHub", "Deploy on Vercel", "CSS animations", "Accessibility basics", "Apply"],
  "Backend Developer":     ["Python or Node.js", "REST API design", "SQL database", "Authentication & security", "Docker basics", "Deploy an API", "Apply"],
  "Cloud Engineer":        ["Linux command line", "Networking basics", "AWS Free Tier", "EC2 S3 IAM Lambda", "AWS Practitioner cert", "Terraform basics", "Apply"]
};

// ── Salary data ──────────────────────────────────────────────
const _salaries = {
  "Data Scientist":        { fresher: "₹6–12 LPA", mid: "₹12–25 LPA", senior: "₹25–50 LPA" },
  "Web Developer":         { fresher: "₹3–8 LPA",  mid: "₹8–18 LPA",  senior: "₹18–35 LPA" },
  "AI Engineer":           { fresher: "₹8–15 LPA", mid: "₹15–30 LPA", senior: "₹30–60 LPA" },
  "Cybersecurity Analyst": { fresher: "₹4–9 LPA",  mid: "₹9–18 LPA",  senior: "₹18–40 LPA" },
  "Data Analyst":          { fresher: "₹4–8 LPA",  mid: "₹8–15 LPA",  senior: "₹15–30 LPA" },
  "Frontend Developer":    { fresher: "₹3–8 LPA",  mid: "₹8–15 LPA",  senior: "₹15–30 LPA" },
  "Backend Developer":     { fresher: "₹4–10 LPA", mid: "₹10–20 LPA", senior: "₹20–40 LPA" },
  "Cloud Engineer":        { fresher: "₹5–11 LPA", mid: "₹11–22 LPA", senior: "₹22–45 LPA" }
};

// ── Career tip pools (5 unique tips per career) ──────────────
const _tips = {
  "Data Scientist": [
    "Focus on Python + Pandas first — they are your daily tools. Once comfortable, move to scikit-learn for ML models.",
    "Kaggle is your best friend. Even finishing 3 competitions shows real ML experience to recruiters.",
    "Statistics is the most underrated Data Science skill. Learn probability, distributions and hypothesis testing — it separates good from great.",
    "SQL is non-negotiable. Most real-world data lives in databases, not CSV files. Master JOINs, CTEs, and window functions.",
    "Learn to tell stories with data — Matplotlib, Seaborn, Plotly. Insights nobody can read are insights nobody acts on."
  ],
  "Web Developer": [
    "Master JavaScript fundamentals deeply before React. Frameworks change — JS fundamentals don't.",
    "Build and deploy 3 real projects: a portfolio site, a CRUD app with backend, and one external API integration.",
    "Responsive design is not optional. 60%+ of web traffic is mobile — if it breaks on phone, it's broken.",
    "Git + GitHub from day one. Every professional project uses version control. Make it a habit now.",
    "CSS Grid and Flexbox are the two layout tools you need. Master both and design stops feeling like a fight."
  ],
  "AI Engineer": [
    "Deep Learning needs strong Python + math foundations. Don't skip linear algebra and calculus basics.",
    "TensorFlow and PyTorch are the two main frameworks. Start with one deeply — jumping between both early confuses more than it helps.",
    "NLP is the hottest AI area right now. Understanding transformers at a high level is a huge resume advantage.",
    "Deploy a model — even a simple image classifier on Hugging Face Spaces. Deployed > theorized, always.",
    "Follow AI researchers on X/Twitter and skim ArXiv papers monthly. This field moves fast — staying current is part of the job."
  ],
  "Cybersecurity Analyst": [
    "Start with networking — TCP/IP, DNS, HTTP. You cannot protect what you do not understand.",
    "Linux is your primary workspace. Get comfortable with the terminal before anything else — commands, permissions, processes.",
    "TryHackMe and HackTheBox are the best hands-on platforms. Theory alone will never get you hired in security.",
    "Certifications carry real weight here. CompTIA Security+ is the recognized starting point for most employers.",
    "Learn to think like an attacker first. Ethical hacking mindset is what separates analysts from manual checklist followers."
  ],
  "Data Analyst": [
    "SQL is your most important skill — write queries every single day until it feels like speaking.",
    "Excel is still heavily used in industry. Advanced features like pivot tables, VLOOKUP, and Power Query are expected.",
    "Pick Power BI or Tableau and build 3 dashboards. Visual storytelling is what data analysts get hired for.",
    "Python with Pandas bridges analyst and scientist. Learning it doubles your career options without starting over.",
    "Data cleaning is 80% of the real job. Mastering how to handle missing values and messy data is critically underrated."
  ],
  "Frontend Developer": [
    "Accessibility matters — learn ARIA labels and semantic HTML. Companies increasingly test candidates for this.",
    "Performance optimization — lazy loading, code splitting, image compression. These are senior skills worth learning early.",
    "Learn basic Figma. Working with designers becomes much smoother when you understand what they're actually asking for.",
    "JavaScript ES6+ features — promises, async/await, destructuring, spread operator. Use them daily until they are instinct.",
    "Deploy everything you build. Vercel and Netlify are free. A live URL in your portfolio is worth 10 private GitHub repos."
  ],
  "Backend Developer": [
    "Understand REST API design deeply — status codes, authentication patterns, proper request/response structure.",
    "Databases are your core domain. Learn SQL well AND at least one NoSQL option like MongoDB or Redis.",
    "Security is backend responsibility — SQL injection, proper authentication, rate limiting, and input validation from day one.",
    "Docker basics are now expected at junior level. Containerization is standard practice — learn it early.",
    "Write clean, well-documented code. Backends are maintained for years. Readability is a professional skill, not optional."
  ],
  "Cloud Engineer": [
    "AWS is the market leader — start with EC2, S3, IAM, and Lambda. These four cover 80% of common cloud work.",
    "AWS Free Tier is your personal lab — build, break, rebuild. Hands-on beats any video course every time.",
    "Linux command line is essential. Most cloud servers run Linux and you will SSH into them constantly.",
    "Infrastructure as Code — learn Terraform basics. It is how modern teams manage cloud resources professionally.",
    "AWS Cloud Practitioner is a strong first certification. It is recognized globally and opens interview doors."
  ]
};

// ── Motivational closers pool ────────────────────────────────
const _closers = [
  "Consistency beats intensity — 30 min daily > 5 hours once a week.",
  "Start messy. Improve as you go. Done > perfect.",
  "Every expert was a beginner. The only difference is they didn't stop.",
  "Build something. Anything. Projects teach more than any course ever will.",
  "The best time to start was yesterday. Second best time is right now.",
  "Skills compound like interest. Every small thing you learn today multiplies over time."
];

// ── Helper: get unique response (never repeats) ──────────────
function _unique(options, fallback = "") {
  const unused = options.filter(o => !_mem.usedResponses.has(o));
  const pool   = unused.length > 0 ? unused : options; // reset if all used
  const pick   = pool[Math.floor(Math.random() * pool.length)];
  _mem.usedResponses.add(pick);
  return pick;
}

function _closer() {
  return _unique(_closers);
}

// ── Helper: get user skills object ──────────────────────────
function _skills() {
  const raw = (typeof userType !== "undefined" && userType === "experienced")
    ? document.getElementById("skillsExp")?.value
    : document.getElementById("skills")?.value;
  const obj = {};
  if (raw && raw.trim()) {
    raw.split(",").forEach(s => {
      const [sk, lv] = s.split(":");
      if (sk) obj[normalizeSkill(sk.trim())] = (lv || "intermediate").trim().toLowerCase();
    });
  }
  return obj;
}

// ── Helper: get selected career ─────────────────────────────
function _career() {
  return document.getElementById("career")?.value || "";
}

// ── Helper: compute gaps ────────────────────────────────────
function _gaps() {
  const career   = _career();
  const required = (typeof careerSkills !== "undefined" && careerSkills[career]) || {};
  const user     = _skills();
  const missing  = [], present = [];
  for (const sk in required) {
    const met = user[sk] && (typeof compareLevel === "function"
      ? compareLevel(user[sk], required[sk].level)
      : true);
    met ? present.push(sk) : missing.push(sk);
  }
  return { missing, present, career };
}

// ── Helper: remember topic ───────────────────────────────────
function _topic(t) {
  _mem.topicHistory.push(t);
  if (_mem.topicHistory.length > 6) _mem.topicHistory.shift();
  _mem.turnCount++;
}

// ── Helper: next career-specific tip (never repeats in order) ─
function _nextTip(career) {
  const pool = _tips[career];
  if (!pool) return null;
  if (!_mem.lastSkillTip[career]) _mem.lastSkillTip[career] = 0;
  const tip = pool[_mem.lastSkillTip[career] % pool.length];
  _mem.lastSkillTip[career]++;
  return tip;
}


// ═══════════════════════════════════════════════════════════
//  MAIN FALLBACK FUNCTION — called when backend is offline
// ═══════════════════════════════════════════════════════════
function chatbotFallback(input) {

  const raw     = input.toLowerCase().trim();
  const user    = _skills();
  const career  = _career();
  const { missing, present } = _gaps();
  const hasSkills = Object.keys(user).length > 0;
  const skillList = Object.keys(user).join(", ") || "none entered yet";

  // ── GREETING ──────────────────────────────────────────────
  if (/^(hi+|hello|hey|hii+|sup|wassup|namaste|helo|yo)$/.test(raw)) {
    _topic("greeting");
    return _unique([
      `Hey! I'm your SkillBridge career mentor. ${hasSkills ? `I can see you have <b>${skillList}</b> — want me to analyse your gaps for <b>${career}</b>?` : "Enter your skills above and I'll guide your career path!"}`,
      `Hello! Ready to help you level up. ${career ? `Your target is <b>${career}</b> — ask me anything about it!` : "Select a target career from the dropdown to get started!"}`,
      `Hi there! ${hasSkills ? `You've entered ${Object.keys(user).length} skills. Ask me what's missing or your best career match!` : "Start by entering your skills in the field above!"}`,
      `Hey! What career goal can I help you crush today? 🎯`
    ]);
  }

  // ── SKILL GAP ─────────────────────────────────────────────
  if (/miss|gap|what.*learn|skill.*need|need.*skill|lacking/.test(raw)) {
    _topic("gap");
    if (!hasSkills) return "👆 Enter your skills in the field above first — then I'll show exactly what you're missing!";
    if (!career)    return "Select your target career from the dropdown above — then I'll calculate your skill gaps instantly!";
    if (missing.length === 0)
      return `🎉 You already cover all required skills for <b>${career}</b>! Focus on building real projects now to stand out. ${_closer()}`;

    const courseLines = missing.map(sk => {
      const c = typeof courseData !== "undefined" && courseData[sk];
      return c ? `<br>📚 <b>${sk}</b> → ${c[0]}` : `<br>📌 <b>${sk}</b> → Search on Coursera or YouTube`;
    }).join("");

    return `For <b>${career}</b> you are missing:<br>${courseLines}<br><br>You already have: ${present.join(", ") || "none matched yet"}<br><br>${_closer()}`;
  }

  // ── BEST CAREER MATCH ─────────────────────────────────────
  if (/best career|career for me|which career|suggest career|career match/.test(raw)) {
    _topic("bestcareer");
    if (!hasSkills) return "👆 Enter your skills above first — I need to know what you have to find your best match!";
    if (typeof careerSkills === "undefined" || typeof calculateMatch === "undefined")
      return "Career data is still loading — try again in a moment!";

    const ranked = Object.entries(careerSkills)
      .map(([c, s]) => ({ c, score: calculateMatch(user, s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const expNote = typeof userType !== "undefined" && userType === "experienced"
      ? ` Your experience gives you a real edge here.` : "";

    return `Based on your skills, your top matches are:<br><br>🥇 <b>${ranked[0].c}</b> — ${ranked[0].score}%<br>🥈 <b>${ranked[1].c}</b> — ${ranked[1].score}%<br>🥉 <b>${ranked[2].c}</b> — ${ranked[2].score}%<br><br>${expNote} Ask me about roadmap or tips for any of these! 💡`;
  }

  // ── MY SKILLS SUMMARY ─────────────────────────────────────
  if (/my skill|what.*have|skills i|profile/.test(raw)) {
    _topic("myskills");
    if (!hasSkills) return "You haven't entered any skills yet! Type them above like: <i>Python, SQL, React</i> 👆";
    return `Here's your current profile:<br><br>✅ <b>Your skills:</b> ${skillList}<br>🟢 <b>Matching ${career}:</b> ${present.join(", ") || "none yet"}<br>🔴 <b>Still needed:</b> ${missing.join(", ") || "none — fully covered! 🎉"}<br><br>Ask me about courses for any missing skill!`;
  }

  // ── ROADMAP ───────────────────────────────────────────────
  if (/roadmap|path|steps|how.*become|get into|start.*career/.test(raw)) {
    _topic("roadmap");
    const steps = career && _roadmaps[career];
    if (!steps) return "Select your target career from the dropdown above for a step-by-step roadmap!";
    const formatted = steps.map((s, i) => `${i + 1}️⃣ ${s}`).join("<br>");
    return `<b>${career} Roadmap:</b><br><br>${formatted}<br><br>${_closer()}`;
  }

  // ── TIPS / ADVICE ─────────────────────────────────────────
  if (/tip|advice|suggest|guide|help me|how.*improve/.test(raw)) {
    _topic("tips");
    const tip = career ? _nextTip(career) : null;
    if (tip) return `💡 <b>${career} Tip:</b><br>${tip}<br><br>${_closer()}`;
    return `Select a target career above for personalised tips! Meanwhile: build projects, stay consistent, and deploy everything you make. ${_closer()}`;
  }

  // ── COURSES / RESOURCES ───────────────────────────────────
  if (/course|resource|where.*learn|tutorial|platform|study/.test(raw)) {
    _topic("courses");
    if (missing.length > 0 && typeof courseData !== "undefined") {
      let html = `Best resources for your <b>${career}</b> gaps:<br>`;
      missing.slice(0, 4).forEach(sk => {
        const c = courseData[sk];
        html += c
          ? `<br>📚 <b>${sk}:</b> ${c.join(" | ")}`
          : `<br>📌 <b>${sk}:</b> Search "${sk} full course" on YouTube`;
      });
      return html + `<br><br>Tip: finish one course + build one project before moving to the next. ${_closer()}`;
    }
    return _unique([
      "Top free platforms:<br><br>🌐 <b>freeCodeCamp</b> — web dev<br>🎓 <b>Coursera</b> — ML, Data Science, Cloud<br>🎯 <b>Kaggle</b> — Data practice<br>💻 <b>TryHackMe</b> — Cybersecurity<br>☁️ <b>AWS Free Tier</b> — Cloud hands-on",
      "Best paid platforms worth the money:<br><br>🎯 <b>Udemy</b> — wait for sales (₹499 deals)<br>🎓 <b>Coursera Plus</b> — best for certificates<br>💡 <b>Scaler / PW Skills</b> — structured for Indian placements"
    ]);
  }

  // ── SALARY ────────────────────────────────────────────────
  if (/salary|pay|package|ctc|earn|income|lpa/.test(raw)) {
    _topic("salary");
    const sal = career && _salaries[career];
    if (sal) return `<b>${career}</b> salary ranges in India:<br><br>🟢 <b>Fresher (0–1 yr):</b> ${sal.fresher}<br>🟡 <b>Mid (2–4 yrs):</b> ${sal.mid}<br>🔵 <b>Senior (5+ yrs):</b> ${sal.senior}<br><br>💡 Salary grows fastest when you combine skills + deployed projects + strong GitHub. ${_closer()}`;
    return "Select a target career from the dropdown above for accurate salary data specific to that role!";
  }

  // ── INTERNSHIP / JOBS ─────────────────────────────────────
  if (/internship|intern|job|placement|hire|recruit/.test(raw)) {
    _topic("internship");
    return _unique([
      "Best internship platforms in India:<br><br>🔷 <b>Internshala</b> — largest student platform<br>🔷 <b>LinkedIn</b> — direct apply + networking<br>🔷 <b>Unstop</b> — competitions + internships<br>🔷 <b>AngelList</b> — startup roles<br>🔷 <b>GitHub</b> — open source = experience<br><br>Tip: a project portfolio gets more responses than a blank resume.",
      "For freshers, open source contributions count as real experience. Find a project on GitHub, fix a bug, raise a PR — that's your first line of experience right there."
    ]);
  }

  // ── PORTFOLIO / PROJECTS ─────────────────────────────────
  if (/portfolio|project|github|build|deploy/.test(raw)) {
    _topic("portfolio");
    return _unique([
      `A strong portfolio needs 3 things: a <b>deployed project</b>, <b>clean code on GitHub</b>, and a <b>README</b> that explains what it does and why.<br><br>For <b>${career || "any dev role"}</b>: quality beats quantity. 2 impressive projects > 10 incomplete ones.`,
      "GitHub is your living resume. Commit code daily — even small changes. Recruiters notice your contribution graph.",
      "Deploy everything. Vercel, Netlify, Render — all free tiers available. A live URL beats a private repo every single time."
    ]);
  }

  // ── TIME / TIMELINE ───────────────────────────────────────
  if (/how long|time|months|schedule|when.*ready|timeline/.test(raw)) {
    _topic("timeline");
    return `Realistic timeline for <b>${career || "most tech roles"}</b>:<br><br>⏱️ <b>1–3 months</b> → solid fundamentals<br>⏱️ <b>3–6 months</b> → first deployed project<br>⏱️ <b>6–9 months</b> → internship-ready<br>⏱️ <b>9–15 months</b> → junior job-ready<br><br>Daily: <b>1–2 focused hours</b> beats weekend cramming every time. ${_closer()}`;
  }

  // ── MOTIVATION / STUCK ────────────────────────────────────
  if (/stuck|demotiv|tired|give up|frustrated|hard|difficult|overwhelm|confus|lost/.test(raw)) {
    _topic("motivation");
    return _unique([
      "Every developer gets stuck — it's literally part of the job. The difference is you keep going. Take a 10-minute break, come back fresh. What specifically is blocking you?",
      "Feeling overwhelmed means you're learning something real. Break it down — what's the ONE smallest next step you can take right now?",
      "Even senior engineers Google things 20 times a day. You are not behind — you're exactly where you're supposed to be. Keep going. 💪",
      "The learning curve is steep and that's normal. But remember — you're building skills that will pay you for decades. That's worth the struggle."
    ]);
  }

  // ── PYTHON SPECIFIC ───────────────────────────────────────
  if (/python/.test(raw)) {
    _topic("python");
    return _unique([
      "Python is the most versatile skill you can have — Data Science, AI, Backend, Automation. One language, unlimited directions.",
      "Best free Python course: 'Python for Everybody' by Dr. Chuck on Coursera. Finish it in 4 weeks and you'll have solid fundamentals.",
      "Practice Python on LeetCode easy problems daily — even 1 problem builds pattern recognition fast.",
      "After basics, pick a direction: Data? → Pandas. Web? → Flask/Django. AI? → TensorFlow/PyTorch."
    ]) + `<br><br>${_closer()}`;
  }

  // ── WHAT CAN YOU DO ───────────────────────────────────────
  if (/what.*you do|can you|help|capabilities/.test(raw)) {
    _topic("capabilities");
    return `Here's what I can help you with:<br><br>📊 <b>Skill gaps</b> → what you're missing for your target career<br>🏆 <b>Career match</b> → which career suits your skills best<br>🗺️ <b>Roadmap</b> → step-by-step learning path<br>📚 <b>Courses</b> → best resources per skill<br>💰 <b>Salary</b> → real Indian market data<br>💼 <b>Internships</b> → where and how to apply<br>💡 <b>Tips</b> → career-specific expert advice<br><br>Try: <i>"what skills am I missing?"</i> or <i>"give me a roadmap"</i>`;
  }

  // ── THANKS ────────────────────────────────────────────────
  if (/^(thanks|thank|ty|thx|great|awesome|helpful|nice|good|ok|okay|cool)$/.test(raw)) {
    _topic("thanks");
    return _unique([
      "Glad I could help! Keep building and stay consistent. 💪",
      "You're welcome! Now go take one action step — don't just plan, build! 🚀",
      "Happy to help! What else would you like to explore?",
      "Anytime! You've got this. One focused hour today is worth more than you think. ⚡"
    ]);
  }

  // ── SMART DEFAULT — always gives career tip if career selected ─
  _topic("default");
  if (career && _tips[career]) {
    return `💡 <b>${career} insight:</b><br>${_nextTip(career)}<br><br>You can ask me about: <i>skill gaps, roadmap, courses, salary, tips, or best career for me.</i>`;
  }

  return _unique([
    "Try asking: <i>'what skills am I missing?'</i> or <i>'give me a roadmap'</i> or <i>'best career for me'</i> 🎯",
    "I'm best at career guidance! Ask about your skill gaps, learning path, salary data, or internship tips.",
    "Not sure I caught that! Try: <i>'what should I learn next?'</i> or <i>'career tips for me'</i>"
  ]);
}


// ──────────────────────────────────────────────────────────
//  extractSkills — calls backend to parse PDF resume
// ──────────────────────────────────────────────────────────
async function extractSkills() {
  const fileInput = document.getElementById("resumeUpload");
  if (!fileInput || fileInput.files.length === 0) {
    document.getElementById("output").innerHTML = "⚠️ Please upload a PDF resume first.";
    return;
  }
  const career = document.getElementById("career")?.value || "Unknown";
  document.getElementById("output").innerHTML = "⏳ Extracting skills from resume...";
  try {
    const fd = new FormData();
    fd.append("resume", fileInput.files[0]);
    fd.append("role", career);
    const res  = await fetch(`${typeof BACKEND !== "undefined" ? BACKEND : "http://127.0.0.1:5000"}/analyze/`, { method: "POST", body: fd });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const fmt  = (data.skills || []).map(s => `${s}:intermediate`).join(", ");
    document.getElementById(userType === "experienced" ? "skillsExp" : "skills").value = fmt;
    document.getElementById("output").innerHTML = `✅ <b>${data.skills?.length || 0} skills extracted</b>. Click <b>Analyze Resume</b> for full roadmap.`;
  } catch {
    document.getElementById("output").innerHTML = "❌ Backend offline. Enter skills manually above.";
  }
}
