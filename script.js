// 🌍 GLOBAL USER TYPE
let userType = "fresher";


// 🚀 RUN AFTER PAGE LOAD
document.addEventListener("DOMContentLoaded", function(){

  // 🎛️ TAB ELEMENTS
  const fresherTab = document.getElementById("fresherTab");
  const experiencedTab = document.getElementById("experiencedTab");
  const slider = document.getElementById("tabSlider");

  const fresherSection = document.getElementById("fresherSection");
  const experiencedSection = document.getElementById("experiencedSection");

  // 🔄 TAB SWITCHING
  fresherTab.addEventListener("click", () => {
    userType = "fresher";
    slider.style.transform = "translateX(0%)";

    fresherTab.classList.add("active");
    experiencedTab.classList.remove("active");

    fresherSection.classList.remove("hidden");
    experiencedSection.classList.add("hidden");
  });

  experiencedTab.addEventListener("click", () => {
    userType = "experienced";
    slider.style.transform = "translateX(100%)";

    experiencedTab.classList.add("active");
    fresherTab.classList.remove("active");

    experiencedSection.classList.remove("hidden");
    fresherSection.classList.add("hidden");
  });


  // 🔥 TRENDING SKILLS
  let list = document.getElementById("trending");

  if (list && typeof trendingSkills !== "undefined") {
    list.innerHTML = "";

    trendingSkills.forEach(skill => {
      let li = document.createElement("li");
      li.innerText = "🔥 " + skill;
      list.appendChild(li);
    });
  }


  // 🔥 DYNAMIC CAREER DROPDOWN
  let dropdown = document.getElementById("career");

  if (dropdown && typeof careerSkills !== "undefined") {
    dropdown.innerHTML = "";

    Object.keys(careerSkills).forEach(career => {
      let option = document.createElement("option");
      option.value = career;
      option.text = career;
      dropdown.appendChild(option);
    });
  }

});


// 🎯 ANALYZE SKILL GAP
function analyze(){ 

  let career = document.getElementById("career").value;

  let userInput = userType === "fresher"
    ? document.getElementById("skills").value
    : document.getElementById("skillsExp").value;

  if(userInput.trim() === ""){
    document.getElementById("output").innerHTML = "⚠️ Please enter your skills first.";
    return;
  }

  let requiredSkills = careerSkills[career];

  if(!requiredSkills){
    document.getElementById("output").innerHTML = "Career data not found.";
    return;
  }

  // 🔥 USER SKILLS OBJECT
  const userSkills = {};

  userInput.split(',').forEach(s => {
    let [skill, level] = s.split(':');

    skill = normalizeSkill(skill);
    level = (level || "intermediate").toLowerCase().trim();

    if(level === "basic") level = "beginner";

    userSkills[skill] = level;
  });

  // 🧠 SOFT SKILLS
  let userSoftInput = [];
  let softField = document.getElementById("softSkills");

  if(softField){
    userSoftInput = softField.value
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(s => s !== "");
  }

  // ❌ MISSING SKILLS
  let missing = [];

  for(let skill in requiredSkills){
    if(!userSkills[skill]){
      missing.push(skill);
    }
  }

  // 🧠 SOFT SCORE
  let softScore = 0;
  let totalSoftWeight = 0;

  let requiredSoft = softSkills[career] || {};

  for(let skill in requiredSoft){
    totalSoftWeight += requiredSoft[skill];

    if(userSoftInput.includes(skill)){
      softScore += requiredSoft[skill];
    }
  }

  let softPercent = totalSoftWeight 
    ? Math.round((softScore / totalSoftWeight) * 100)
    : 0;

  // 🎯 TECH SCORE
  let score = calculateMatch(userSkills, requiredSkills);

  // 🎯 FINAL SCORE
  let finalScore = userSoftInput.length > 0
    ? Math.round((score * 0.7) + (softPercent * 0.3))
    : score;

  // 💼 EXPERIENCE BOOST
  let extraInfo = "";

  if(userType === "experienced"){
    let years = parseInt(document.getElementById("experienceYears").value) || 0;
    let role = document.getElementById("jobRole").value || "Not specified";

    finalScore += Math.min(years * 2, 10);

    extraInfo = `
      <h3>💼 Experience Details</h3>
      <p>Years: ${years}</p>
      <p>Previous Role: ${role}</p>
    `;
  }

  // 📚 COURSES
  let coursesHTML = "";

  missing.forEach(skill => {
    if(courseData[skill]){
      coursesHTML += `<h4>${skill}</h4><ul>`;
      courseData[skill].forEach(course=>{
        coursesHTML += `<li>${course}</li>`;
      });
      coursesHTML += "</ul>";
    }
  });

  // 🛣️ ROADMAP
  let roadmap = "";

  missing.forEach((skill, index) => {
    roadmap += `<li>Week ${index*2+1}-${index*2+2}: Learn ${skill}</li>`;
  });

  let roadmapHTML = `
    <h3>🛣️ Personalized Roadmap</h3>
    <ol>
      ${roadmap || "<li>You are job-ready! 🎉</li>"}
    </ol>
  `;

  // 🎯 OUTPUT
  let result = `
    <h2>🎯 ${career} Skill Analysis</h2>

    ${extraInfo}

    <h3>📊 Technical Score: ${score}%</h3>
    <h3>🧠 Soft Skills Score: ${softPercent}%</h3>
    <h3>🎯 Overall Score: <span style="color:#4ade80">${finalScore}%</span></h3>

    <h3>✅ Your Skills</h3>
    <p>${Object.keys(userSkills).join(", ") || "None"}</p>

    <h3>📌 Missing Skills</h3>
    <p style="color:#f87171">${missing.join(", ") || "None 🎉"}</p>

    <h3>📚 Recommended Courses</h3>
    ${coursesHTML || "No course recommendations available"}

    ${roadmapHTML}
  `;

  document.getElementById("output").innerHTML = result;

  document.getElementById("output").scrollIntoView({ behavior: "smooth" });
}


// 🚀 SUGGEST CAREERS
function suggestCareers(){

  let userInput = userType === "fresher"
    ? document.getElementById("skills").value
    : document.getElementById("skillsExp").value;

  if(userInput.trim() === ""){
    document.getElementById("output").innerHTML = "⚠️ Please enter your skills first.";
    return;
  }

  let userSkills = {};

  userInput.split(',').forEach(s => {
    let [skill, level] = s.split(':');

    skill = normalizeSkill(skill);
    level = (level || "intermediate").toLowerCase().trim();

    userSkills[skill] = level;
  });

  let results = [];

  for(let career in careerSkills){
    let score = calculateMatch(userSkills, careerSkills[career]);

    if(score > 0){
      results.push({ career, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  let html = "<h2>💡 Suggested Career Paths</h2>";

  results.slice(0, 5).forEach(item => {
    html += `<p><b>${item.career}</b> - ${item.score}% match</p>`;
  });

  document.getElementById("output").innerHTML = html;
}


// 🚀 BEST CAREER
function recommendCareer(){

  let userInput = userType === "fresher"
    ? document.getElementById("skills").value
    : document.getElementById("skillsExp").value;

  if(userInput.trim() === ""){
    document.getElementById("output").innerHTML = "⚠️ Please enter your skills first.";
    return;
  }

  let userSkills = {};

  userInput.split(',').forEach(s => {
    let [skill, level] = s.split(':');

    skill = normalizeSkill(skill);
    level = (level || "intermediate").toLowerCase().trim();

    userSkills[skill] = level;
  });

  let bestCareer = "";
  let maxScore = 0;

  for(let career in careerSkills){
    let score = calculateMatch(userSkills, careerSkills[career]);

    if(score > maxScore){
      maxScore = score;
      bestCareer = career;
    }
  }

  document.getElementById("output").innerHTML = bestCareer
    ? `<h2>🚀 Recommended Career</h2>
       <p><b>${bestCareer}</b></p>
       <p>Match Score: ${maxScore}%</p>`
    : "No suitable career found.";
}