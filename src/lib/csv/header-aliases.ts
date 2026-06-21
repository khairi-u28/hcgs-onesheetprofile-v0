export const HEADER_ALIASES = {
  // Employee master & common
  NRP: ["NRP", "Employee NRP", "employeeNrp", "Employee Number", "EmployeeNumber", "Personnel Number", "Name/NRP"],
  Nama: ["Nama", "Name", "name", "Nama/NRP"],
  Position: ["Position", "Job Position", "Current Position", "position"],
  POS: ["POS", "pos"],
  "Branch Code": ["Branch Code", "branchCode", "BranchCode"],
  "Region/Div": ["Region/Div", "regionDiv", "Region/Division"],
  "Area/Dept": ["Area/Dept", "areaDept", "Area/Department"],
  "Entry Date": ["Entry Date", "entryDate", "Join Date", "Assignment Start"],
  "Date of Birth": ["Date of Birth", "dateOfBirth"],
  "Masa Kerja Total": ["Masa Kerja Total", "masaKerjaTotal"],
  "Masa Kerja Jabatan": ["Masa Kerja Jabatan", "masaKerjaJabatan"],
  "Masa Kerja Cabang": ["Masa Kerja Cabang", "masaKerjaCabang"],
  HAV: ["HAV", "HAV Raw", "HAV Category", "havCategory"],
  "Last Dev'l Program": ["Last Dev'l Program", "lastDevelopmentProgram"],
  "Status Dev'l Program": ["Status Dev'l Program", "developmentProgramStatus"],
  "Periode Dev'l Program": ["Periode Dev'l Program", "developmentProgramPeriod"],
  Gol: ["Gol", "golongan", "Golongan"],
  "KPI Mid Year": ["KPI Mid Year", "kpiMidYear"],
  "KPI Full Year": ["KPI Full Year", "kpiFullYear"],
  "PK 2023": ["PK 2023", "pk2023"],
  "PK 2024": ["PK 2024", "pk2024"],
  "PK 2025": ["PK 2025", "pk2025"],
  "Link Photo": ["Link Photo", "photoUrl"],
  "Strength 1": ["Strength 1", "strength1"],
  "Strength 2": ["Strength 2", "strength2"],
  "Areas of Development 1": ["Areas of Development 1", "developmentArea1"],
  "Areas of Development 2": ["Areas of Development 2", "developmentArea2"],
  "Level Pendidikan Terakhir": ["Level Pendidikan Terakhir", "educationLevel"],
  "Institusi Pendidikan Terakhir": ["Institusi Pendidikan Terakhir", "educationInstitution"],

  // Training history specific
  "Training Name": ["Training Name", "trainingName"],
  "Completion Date": ["Completion Date", "completionDate", "completionYear", "Training Year", "trainingYear", "Tanggal Sertifikat"],
  Status: ["Status", "status"],
  Score: ["Score", "score"],
  Category: ["Category", "category"],

  // Work history specific
  "Start Date": ["Start Date", "StartDate", "Join Date", "Assignment Start"],
  "End Date": ["End Date", "EndDate", "Assignment End"],
  "Branch Name": ["Branch Name", "branchName", "Cabang", "Branch"],
} as const;

export function cleanHeaderString(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

export function getCanonicalHeader(rawHeader: string, expectedKeys: string[]): string | undefined {
  const cleanRaw = cleanHeaderString(rawHeader);
  for (const key of expectedKeys) {
    const aliases = HEADER_ALIASES[key as keyof typeof HEADER_ALIASES];
    if (aliases) {
      const match = aliases.some(alias => cleanHeaderString(alias) === cleanRaw);
      if (match) {
        return key;
      }
    }
  }
  return undefined;
}
