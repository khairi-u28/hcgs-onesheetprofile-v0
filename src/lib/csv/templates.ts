import Papa from "papaparse";

export function generateEmployeeTemplate(): string {
  const headers = [
    "NRP", "Nama", "Position", "POS", "Branch Code", "Region/Div", "Area/Dept",
    "Entry Date", "Date of Birth", "Masa Kerja Total", "Masa Kerja Jabatan", "Masa Kerja Cabang",
    "HAV", "Last Dev'l Program", "Status Dev'l Program", "Periode Dev'l Program",
    "Gol", "KPI Mid Year", "KPI Full Year", "PK 2023", "PK 2024", "PK 2025",
    "Link Photo", "Strength 1", "Strength 2", "Areas of Development 1", "Areas of Development 2",
    "Level Pendidikan Terakhir", "Institusi Pendidikan Terakhir"
  ];

  const rows = [
    [
      "37806", "HADI KANUGRAHA", "TSO Collection Officer PASURUAN", "Collection Officer", "T486", "JATKALBAL", "JATIM",
      "2013-01-03", "1972-03-25", "13-05", "05-02", "05-02", "Strong Performer (8)", "MDP FAH", "Ongoing", "2021",
      "3A", "0.9", "0.95", "BS", "BS", "B+", "https://i.pravatar.cc/300?u=37806", "Analysis & Judgement", "Drive & Courage",
      "Customer Focus", "Leading & Motivating", "SMK", "SMK Negeri 6"
    ],
    [
      "39233", "NURAINI PERMANA SETIAWAN", "TSO Account Officer BP KEDIRI", "Account Officer", "T482", "JATKALBAL", "JATIM",
      "2023-12-11", "1991-06-08", "02-06", "01-03", "01-03", "Unfit Employee (11)", "Project Management Essentials", "Not Started", "2026",
      "3C", "0.47", "0.52", "C", "K", "K", "https://i.pravatar.cc/300?u=39233", "Customer Focus", "Leading & Motivating",
      "Planning & Driving Action", "Interpersonal Skill", "S1", "Universitas Diponegoro"
    ],
    [
      "75765", "ALBERT GUNAWAN", "TSO Collection Officer BP SANUR", "Collection Officer", "T544", "JATKALBAL", "BALI",
      "2014-01-12", "1992-12-27", "12-05", "12-05", "12-05", "Potential Candidate (4)", "Time Management Workshop", "Not Started", "2025",
      "3C", "0.88", "0.91", "C", "C+", "C", "https://i.pravatar.cc/300?u=75765", "Leading & Motivating", "Drive & Courage",
      "Analysis & Judgement", "Interpersonal Skill", "S2", "Prasetiya Mulya"
    ],
    [
      "36334", "FELIX ANDINI", "TSO Product Advisor Spv. SBY KERTAJAYA", "Product Advisor Supervisor", "T461", "JATKALBAL", "JATIM",
      "2010-01-25", "1988-06-08", "16-04", "04-00", "04-00", "Potential Candidate (4)", "Coaching & Mentoring Program", "Completed", "2024",
      "4A", "0.69", "0.75", "C+", "B", "B", "https://i.pravatar.cc/300?u=36334", "Customer Focus", "Leading & Motivating",
      "Planning & Driving Action", "Analysis & Judgement", "S1", "Universitas Diponegoro"
    ],
    [
      "37807", "BUDI SANTOSO", "TSO Sales Advisor SBY KERTAJAYA", "Sales Advisor", "T461", "JATKALBAL", "JATIM",
      "2015-05-10", "1985-12-12", "11-01", "05-00", "05-00", "Strong Performer (8)", "MDP FAH", "Completed", "2023",
      "3B", "0.92", "0.91", "B", "B+", "B", "https://i.pravatar.cc/300?u=37807", "Drive & Courage", "Analysis & Judgement",
      "Customer Focus", "Interpersonal Skill", "S1", "Universitas Indonesia"
    ],
    [
      "DELETE THESE SAMPLE ROWS BEFORE IMPORT", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ]
  ];

  return Papa.unparse({ fields: headers, data: rows });
}

export function generateTrainingTemplate(): string {
  const headers = ["NRP", "Training Name", "Completion Date", "Status", "Score", "Category"];
  const rows = [
    ["37806", "MDP FAH", "2021-06-15", "Ongoing", "85", "Leadership"],
    ["39233", "Project Management Essentials", "2026-03-20", "Not Started", "0", "Management"],
    ["75765", "Time Management Workshop", "2025-11-10", "Not Started", "0", "Personal Development"],
    ["36334", "Coaching & Mentoring Program", "2024-05-15", "Completed", "90", "Leadership"],
    ["37807", "MDP FAH", "2023-08-12", "Completed", "95", "Leadership"],
    ["DELETE THESE SAMPLE ROWS BEFORE IMPORT", "", "", "", "", ""]
  ];

  return Papa.unparse({ fields: headers, data: rows });
}

export function generateWorkHistoryTemplate(): string {
  const headers = ["NRP", "Position", "POS", "Branch Code", "Branch Name", "Start Date", "End Date"];
  const rows = [
    ["37806", "TSO Collection Officer", "Collection Officer", "T486", "PASURUAN", "2013-01-03", "2018-03-01"],
    ["39233", "TSO Account Officer", "Account Officer", "T482", "BP KEDIRI", "2023-12-11", "2024-12-31"],
    ["75765", "TSO Collection Officer", "Collection Officer", "T544", "BP SANUR", "2014-01-12", "2019-06-30"],
    ["36334", "TSO Product Advisor", "Product Advisor", "T461", "SBY KERTAJAYA", "2010-01-25", "2020-04-15"],
    ["37807", "TSO Sales Supervisor", "Sales Advisor", "T461", "SBY KERTAJAYA", "2015-05-10", "2020-10-01"],
    ["DELETE THESE SAMPLE ROWS BEFORE IMPORT", "", "", "", "", "", ""]
  ];

  return Papa.unparse({ fields: headers, data: rows });
}
