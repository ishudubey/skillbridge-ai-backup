// 🎯 KNOWN SKILLS
const knownSkills = [
  "python", "machine learning", "sql", "html", "css", "javascript",
  "react", "node.js", "deep learning", "tensorflow", "nlp",
  "networking", "linux", "data visualization", "excel",
  "cloud computing", "aws", "database", "api"
];


// 📄 RESUME SKILL EXTRACTION (FIXED 🔥)
function extractSkills() {

  let fileInput = document.getElementById("resumeUpload");

  if (fileInput.files.length === 0) {
    alert("Upload resume image");
    return;
  }

  let file = fileInput.files[0];

  document.getElementById("output").innerHTML = "⏳ Extracting skills...";

  Tesseract.recognize(file, 'eng')
    .then(result => {

      let text = result.data.text.toLowerCase();
      let detected = [];

      knownSkills.forEach(skill => {
        if (text.includes(skill)) {
          detected.push(skill);
        }
      });

      detected = [...new Set(detected.map(s => normalizeSkill(s)))];

      let formatted = detected.map(skill => `${skill}:intermediate`);

      // 🔥 FIX: put in correct input
      if(userType === "fresher"){
        document.getElementById("skills").value = formatted.join(", ");
      } else {
        document.getElementById("skillsExp").value = formatted.join(", ");
      }

      document.getElementById("output").innerHTML =
        "✅ Skills Extracted Successfully!";
    })
    .catch(() => {
      document.getElementById("output").innerHTML =
        "❌ Error extracting text.";
    });
}



// 🤖 SMART CHATBOT RESPONSE (UPGRADED)
function chatbotResponse(input) {

  input = input.toLowerCase();

  // 🎯 GET USER SKILLS BASED ON TAB
  let userInput = userType === "fresher"
    ? document.getElementById("skills").value
    : document.getElementById("skillsExp").value;

  // 🔥 Convert to object
  let userSkills = {};

  if(userInput.trim() !== ""){
    userInput.split(',').forEach(s => {
      let [skill, level] = s.split(':');

      skill = normalizeSkill(skill);
      level = (level || "intermediate").toLowerCase().trim();

      userSkills[skill] = level;
    });
  }

  // 🔥 Skill-based replies
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

  // 🚀 DYNAMIC CAREER MATCH (FIXED)
  if (input.includes("career") || input.includes("best")) {

    if(Object.keys(userSkills).length === 0){
      return "Enter your skills first so I can suggest a career.";
    }

    let bestCareer = "";
    let maxScore = 0;

    for(let career in careerSkills){

      let score = calculateMatch(userSkills, careerSkills[career]);

      if(score > maxScore){
        maxScore = score;
        bestCareer = career;
      }
    }

    // 💼 EXPERIENCE CONTEXT (NEW 🔥)
    let extra = "";

    if(userType === "experienced"){
      let years = parseInt(document.getElementById("experienceYears").value) || 0;
      extra = ` With your ${years} years of experience, you have an advantage.`;
    }

    return `Based on your skills, ${bestCareer} suits you best (${maxScore}% match).${extra}`;
  }

  // 📚 LEARNING HELP
  if (input.includes("improve") || input.includes("learn")) {
    return "Focus on high-weight skills, build projects, and stay consistent.";
  }

  if (input.includes("roadmap")) {
    return "Start with basics → projects → advanced skills → internships/jobs.";
  }

  // 🤖 DEFAULT
  return "I can help with career suggestions, skill gaps, and learning paths. Try asking: 'best career for me'.";
}



// 💬 SEND MESSAGE
function sendMessage() {

  let inputField = document.getElementById("chatInput");
  let chatbox = document.getElementById("chatbox");

  let input = inputField.value.trim();

  if (input === "") return;

  chatbox.innerHTML += `<p><b>You:</b> ${input}</p>`;

  let reply = chatbotResponse(input);

  chatbox.innerHTML += `<p><b>AI:</b> ${reply}</p>`;

  inputField.value = "";

  chatbox.scrollTop = chatbox.scrollHeight;
}