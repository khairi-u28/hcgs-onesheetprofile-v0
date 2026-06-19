const fs = require('fs');
const path = require('path');

const orgData = require('./src/data/organization.json');
// Select 10 valid branches from different regions and areas
const targetBranches = orgData.filter((b, i) => i % 50 === 0).slice(0, 10);

const totalEmployees = 500;
const employees = [];
const training = [];
const workHistory = [];

const HAV_CATEGORIES = ["Strong Performer", "Candidate", "Career Person", "Potential Candidate", "Unfit Employee", ""];
const POSITIONS = ["Sales Executive", "Service Advisor", "Branch Manager", "Mechanic", "Administration"];
const DEV_STATUSES = ["Completed", "Ongoing", "Not Started", ""];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

for (let i = 1; i <= totalEmployees; i++) {
  const nrp = `UAT${String(i).padStart(4, '0')}`;
  const branch = rand(targetBranches);
  
  // Distribute HAV categories
  let hav = HAV_CATEGORIES[i % HAV_CATEGORIES.length];
  let kpiMid = null;
  let kpiFull = null;
  let pk = rand(["BS", "B+", "B", "C+", "C", "K", ""]);
  
  if (hav === "Strong Performer") {
    kpiFull = randInt(90, 100);
    pk = rand(["BS", "B+"]);
  } else if (hav === "Unfit Employee") {
    kpiFull = randInt(40, 60);
  } else {
    if (i % 20 === 0) kpiFull = null; // Missing KPI
    else kpiFull = randInt(50, 95);
  }

  let devStatus = rand(DEV_STATUSES);
  if (i % 15 === 0) devStatus = ""; // Missing dev status
  
  let photo = `https://i.pravatar.cc/150?u=${nrp}`;
  if (i % 25 === 0) photo = ""; // Missing photo
  
  employees.push({
    nrp,
    name: `Test Employee ${i}`,
    position: rand(POSITIONS),
    pos: `POS-${randInt(1,5)}`,
    branchCode: branch.branchCode,
    photoUrl: photo,
    entryDate: `201${randInt(0,9)}-0${randInt(1,9)}-15`,
    dateOfBirth: `19${randInt(70,99)}-0${randInt(1,9)}-15`,
    havCategory: hav,
    havScore: kpiFull ? (kpiFull / 20).toFixed(1) : "",
    havRaw: "B,B,C",
    kpiMidYear: kpiMid !== null ? (kpiMid / 100).toFixed(2) : "",
    kpiFullYear: kpiFull !== null ? (kpiFull / 100).toFixed(2) : "",
    pk2025: pk,
    pk2024: pk ? "B" : "",
    pk2023: pk ? "B+" : "",
    developmentProgramStatus: devStatus
  });

  if (i % 10 !== 0) {
    const statuses = ["Completed", "Failed", "On Going", "Promoted"];
    let status = rand(statuses);
    if (i % 50 === 0) status = "Failed"; 
    
    training.push({
      employeeNrp: nrp,
      trainingName: `Leadership Program ${randInt(1,3)}`,
      completionDate: `202${randInt(3,5)}-0${randInt(1,9)}-10`,
      status: status
    });
  }

  if (i % 12 !== 0) {
    workHistory.push({
      nrp,
      position: rand(POSITIONS),
      pos: `POS-${randInt(1,5)}`,
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      startDate: `201${randInt(0,5)}-01-01`,
      endDate: `2020-01-01`
    });
  }
}

const empCsv = [
  "nrp,name,position,pos,branchCode,photoUrl,entryDate,dateOfBirth,havCategory,havScore,havRaw,kpiMidYear,kpiFullYear,pk2025,pk2024,pk2023,developmentProgramStatus",
  ...employees.map(e => Object.values(e).join(","))
].join("\n");

const trainCsv = [
  "employeeNrp,trainingName,completionDate,status",
  ...training.map(t => Object.values(t).join(","))
].join("\n");

const workCsv = [
  "nrp,position,pos,branchCode,branchName,startDate,endDate",
  ...workHistory.map(w => Object.values(w).join(","))
].join("\n");

fs.mkdirSync('./uat_data', { recursive: true });
fs.writeFileSync('./uat_data/employee_uat.csv', empCsv);
fs.writeFileSync('./uat_data/training_history_uat.csv', trainCsv);
fs.writeFileSync('./uat_data/work_history_uat.csv', workCsv);

console.log("Generated UAT datasets successfully!");
