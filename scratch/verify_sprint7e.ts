import fs from "fs";
import path from "path";
import { parseEmployeeDataset } from "../src/lib/csv/employee-parser";
import { parseTrainingDataset } from "../src/lib/csv/training-parser";
import { parseWorkHistoryDataset } from "../src/lib/csv/work-history-parser";
import { generateEmployeeTemplate, generateTrainingTemplate, generateWorkHistoryTemplate } from "../src/lib/csv/templates";
import { slugifyOrganizationName, slugifyRegionName } from "../src/lib/utils/slugify";
import orgData from "../src/data/organization.json";
import { differenceInMonths, parseISO } from "date-fns";

function runVerification() {
  console.log("=== STARTING SPRINT 7E AUTOMATED VERIFICATION ===");
  let failures = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      failures++;
    }
  };

  const branchCodes = new Set(orgData.map((b: any) => b.branchCode.toUpperCase()));

  // 1. Verify Template Column Count & Parser Expected Keys Match
  console.log("\n--- Checking Template columns vs Parsers expected columns ---");
  
  const getCsvHeaders = (csv: string) => csv.split("\n")[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  
  const empCsv = generateEmployeeTemplate();
  const empHeaders = getCsvHeaders(empCsv);
  assert(empHeaders.length === 29, `Employee template has exactly 29 columns (found: ${empHeaders.length})`);

  const trainCsv = generateTrainingTemplate();
  const trainHeaders = getCsvHeaders(trainCsv);
  assert(trainHeaders.length === 7, `Training template has exactly 7 columns (found: ${trainHeaders.length})`);
  assert(JSON.stringify(trainHeaders) === JSON.stringify(["NRP", "Training Name", "Start Date", "End Date", "Batch", "Period", "Status"]), "Training headers are exactly canonical: NRP, Training Name, Start Date, End Date, Batch, Period, Status");

  const workCsv = generateWorkHistoryTemplate();
  const workHeaders = getCsvHeaders(workCsv);
  assert(workHeaders.length === 7, `Work history template has exactly 7 columns (found: ${workHeaders.length})`);
  assert(JSON.stringify(workHeaders) === JSON.stringify(["NRP", "Position", "POS", "Branch Code", "Branch Name", "Start Date", "End Date"]), "Work history headers are exactly canonical: NRP, Position, POS, Branch Code, Branch Name, Start Date, End Date");

  // 2. Parse 500 employee records without warning
  console.log("\n--- Testing 500-row Employee Import ---");
  let mockEmpCsv = `NRP,Nama,Position,POS,Branch Code,Region/Div,Area/Dept,Entry Date,Date of Birth,Masa Kerja Total,Masa Kerja Jabatan,Masa Kerja Cabang,HAV,Last Dev'l Program,Status Dev'l Program,Periode Dev'l Program,Gol,KPI Mid Year,KPI Full Year,PK 2023,PK 2024,PK 2025,Link Photo,Strength 1,Strength 2,Areas of Development 1,Areas of Development 2,Level Pendidikan Terakhir,Institusi Pendidikan Terakhir\n`;
  const sampleBranch = orgData[0].branchCode;
  const sampleRegion = orgData[0].region;
  const sampleArea = orgData[0].area;
  
  // Inject the specific 5 NRPs used in the template files to avoid relationship integrity warnings
  const templateNrps = ["37806", "39233", "75765", "36334", "37807"];
  templateNrps.forEach((nrp, idx) => {
    mockEmpCsv += `${nrp},Template Employee ${idx},Staff,ST,${sampleBranch},${sampleRegion},${sampleArea},2020-01-01,1990-01-01,05-00,05-00,05-00,Strong Performer (8),,,,,,0.8,0.85,B,B,B,https://i.pravatar.cc/300?u=${nrp},Strength1,Strength2,Dev1,Dev2,S1,University\n`;
  });

  // Generate the rest to sum up to exactly 500 employees
  for (let i = 1; i <= 495; i++) {
    const nrp = String(10000 + i);
    mockEmpCsv += `${nrp},Employee ${i},Staff,ST,${sampleBranch},${sampleRegion},${sampleArea},2020-01-01,1990-01-01,05-00,05-00,05-00,Strong Performer (8),,,,,,0.8,0.85,B,B,B,https://i.pravatar.cc/300?u=${nrp},Strength1,Strength2,Dev1,Dev2,S1,University\n`;
  }
  const empResult = parseEmployeeDataset(mockEmpCsv, branchCodes);
  assert(empResult.data.length === 500, `Parsed all 500 employees`);
  
  const empUnexpectedIssues = empResult.issues.filter(issue => issue.code !== "TEMPLATE_REMINDER_ROW");
  assert(empUnexpectedIssues.length === 0, `Generated 0 unexpected parser issues for 500 employees`);

  // 3. Parse Training Template (new 7-column format)
  console.log("\n--- Testing Redesigned Training Template Import ---");
  const trainResult = parseTrainingDataset(trainCsv, new Set(empResult.data.map(e => e.nrp)));
  assert(trainResult.data.length === 5, `Parsed 5 training rows from template`);
  
  const trainUnexpectedIssues = trainResult.issues.filter(
    issue => issue.code !== "TEMPLATE_REMINDER_ROW" && issue.code !== "INVALID_TRAINING_STATUS"
  );
  assert(trainUnexpectedIssues.length === 0, `Generated 0 unexpected issues for training template (found: ${trainResult.issues.length} expected warning issues)`);

  // 4. Parse Legacy Training CSV (backward compatibility)
  console.log("\n--- Testing Legacy Training Import (Completion Date & Tanggal Sertifikat) ---");
  const legacyTrainCsv = `NRP,Training Name,Tanggal Sertifikat,Status\n37806,Legacy Training 1,2022-05-15,Lulus\n39233,Legacy Training 2,2023-06-20,Completed`;
  const legacyResult = parseTrainingDataset(legacyTrainCsv, new Set(empResult.data.map(e => e.nrp)));
  assert(legacyResult.data.length === 2, `Parsed 2 legacy training records`);
  assert(legacyResult.issues.length === 0, `Generated 0 issues for legacy training`);
  assert(!!legacyResult.data[0].completionDate, `completionDate mapped correctly`);
  assert(legacyResult.data[0].endDate === legacyResult.data[0].completionDate, `endDate fell back to completionDate correctly`);
  assert(legacyResult.data[0].status === "Completed", `Status "Lulus" normalized to "Completed"`);

  // 5. Parse Work History with NOW, CURRENT, ACTIVE
  console.log("\n--- Testing Work History with NOW/CURRENT/ACTIVE ---");
  const testWorkCsv = `NRP,Position,POS,Branch Code,Branch Name,Start Date,End Date
37806,Developer,Dev,T000,HEAD OFFICE,2020-01-01,NOW
39233,Designer,Des,T000,HEAD OFFICE,2021-02-01,CURRENT
37807,Tester,Tes,T000,HEAD OFFICE,2022-03-01,ACTIVE
36334,Manager,Mgr,T000,HEAD OFFICE,2018-01-01,2020-12-31`;
  
  const workResult = parseWorkHistoryDataset(testWorkCsv, new Set(empResult.data.map(e => e.nrp)));
  assert(workResult.data.length === 4, `Parsed 4 work history rows`);
  
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Row 0: NOW
  assert(workResult.data[0].isCurrent === true, `Row 0 (NOW) has isCurrent = true`);
  assert(workResult.data[0].rawEndDate === "NOW", `Row 0 has rawEndDate = "NOW"`);
  assert(workResult.data[0].endDate === todayStr, `Row 0 has endDate set to today: ${todayStr}`);

  // Row 1: CURRENT
  assert(workResult.data[1].isCurrent === true, `Row 1 (CURRENT) has isCurrent = true`);
  assert(workResult.data[1].rawEndDate === "CURRENT", `Row 1 has rawEndDate = "CURRENT"`);
  assert(workResult.data[1].endDate === todayStr, `Row 1 has endDate set to today: ${todayStr}`);

  // Row 2: ACTIVE
  assert(workResult.data[2].isCurrent === true, `Row 2 (ACTIVE) has isCurrent = true`);
  assert(workResult.data[2].rawEndDate === "ACTIVE", `Row 2 has rawEndDate = "ACTIVE"`);
  assert(workResult.data[2].endDate === todayStr, `Row 2 has endDate set to today: ${todayStr}`);

  // Row 3: Standard End Date
  assert(workResult.data[3].isCurrent === false, `Row 3 (Standard) has isCurrent = false`);
  assert(workResult.data[3].rawEndDate === null, `Row 3 has rawEndDate = null`);
  assert(!!workResult.data[3].endDate, `Row 3 has endDate parsed`);

  // Verify durations aren't NaN
  workResult.data.forEach((r, idx) => {
    const m = differenceInMonths(parseISO(r.endDate || ""), parseISO(r.startDate || ""));
    assert(!isNaN(m), `Duration for row ${idx} is numeric: ${m} months`);
  });

  // 6. Organization Routing verification
  console.log("\n--- Testing Organization Routing Slugification ---");
  assert(slugifyOrganizationName("HEAD OFFICE") === "head-office", `"HEAD OFFICE" slugifies to "head-office"`);
  assert(slugifyOrganizationName("DKI,JABAR,PRIME FLEET") === "dki-jabar-prime-fleet", `"DKI,JABAR,PRIME FLEET" slugifies to "dki-jabar-prime-fleet"`);
  assert(slugifyRegionName("HEAD OFFICE") === "head-office", `slugifyRegionName matches slugifyOrganizationName`);

  console.log(`\n=== VERIFICATION FINISHED with ${failures} failures ===`);
  process.exit(failures > 0 ? 1 : 0);
}

runVerification();
