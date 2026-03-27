// 📊 SHOW DASHBOARD
function showDashboard() {

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
    level = (level || "beginner").toLowerCase().trim();

    userSkills[skill] = level;
  });

  let learned = [];
  let remaining = [];

  let score = 0;
  let totalWeight = 0;

  // 🔥 PROCESS SKILLS
  for(let skill in requiredSkills){

    let level = requiredSkills[skill].level || "beginner";
    let weight = requiredSkills[skill].weight || 1;

    totalWeight += weight;

    if(userSkills[skill] && compareLevel(userSkills[skill], level)){
      learned.push(skill);
      score += weight;
    } else {
      remaining.push(skill);
    }
  }

  let progress = totalWeight 
    ? Math.round((score / totalWeight) * 100)
    : 0;

  // 💼 EXPERIENCE BOOST
  let extraInfo = "";

  if(userType === "experienced"){
    let years = parseInt(document.getElementById("experienceYears").value) || 0;
    let role = document.getElementById("jobRole").value || "Not specified";

    progress += Math.min(years * 2, 10);

    extraInfo = `
      <h3>💼 Experience Overview</h3>
      <p>Years: ${years}</p>
      <p>Role: ${role}</p>
    `;
  }

  // 🧠 LEVEL → NUMBER
  function levelToNumber(level){
    return level === "advanced" ? 100 :
           level === "intermediate" ? 70 : 40;
  }

  let labels = Object.keys(requiredSkills);

  let chartData = labels.map(skill => {
    if(userSkills[skill]){
      return levelToNumber(userSkills[skill]);
    } else {
      return 20;
    }
  });

  // 🎯 UI OUTPUT
  let html = `
    <h2>📊 Skill Dashboard</h2>

    ${extraInfo}

    <p><b>Overall Progress:</b> ${progress}%</p>
    <progress value="${progress}" max="100"></progress>

    <h3>✅ Completed Skills</h3>
    <p>${learned.join(", ") || "None yet"}</p>

    <h3>📌 Remaining Skills</h3>
    <p>${remaining.join(", ") || "None 🎉"}</p>

    <canvas id="skillChart" style="margin-top:20px;"></canvas>
  `;

  document.getElementById("output").innerHTML = html;

  // 📊 DESTROY OLD CHART
  if(window.skillChartInstance){
    window.skillChartInstance.destroy();
  }

  let ctx = document.getElementById("skillChart").getContext("2d");

  // 📊 CREATE NEW CHART
  window.skillChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Skill Level',
        data: chartData
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#fff"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#cbd5f5"
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#cbd5f5"
          }
        }
      }
    }
  });

  // 💾 SAVE DATA
  localStorage.setItem("userSkills", JSON.stringify(userSkills));
}