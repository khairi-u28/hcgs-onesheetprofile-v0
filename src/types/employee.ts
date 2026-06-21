export const HAV_MASTER = {
  1: "Star",
  2: "Future Star",
  3: "Future Star",
  4: "Potential Candidate",
  5: "Raw Diamond",
  6: "Candidate",
  7: "Top Performer",
  8: "Strong Performer",
  9: "Career Person",
  10: "Most Unfit Employee",
  11: "Unfit Employee",
  12: "Problem Employee",
  13: "Maximal Contributor",
  14: "Contributor",
  15: "Minimal Contributor",
  16: "Dead Wood",
} as const;

export type PkRating = "BS" | "B+" | "B" | "C+" | "C" | "K";

export type DevelopmentProgramStatus =
  | "Completed"
  | "Ongoing"
  | "Not Started"
  | string;

/**
 * Employee data model used throughout the One Sheet Profile application.
 * All fields correspond to columns in `employees.csv`.
 */
export type EmployeeRecord = {
  nrp: string;                     // Unique personnel number
  name: string;                    // Full name
  position: string;                // Current position title
  pos: string;                     // Position abbreviation (POS)
  branchCode: string;              // Branch code
  regionDiv: string;               // Region / Division
  areaDept: string;                // Area / Department
  entryDate: string | null;        // Date of entry into the organization (ISO string, can be null)
  dateOfBirth: string | null;      // Birth date (ISO string, can be null)
  havCategory: any;      // HAV category description (can be null)
  havScore: number | null;         // Numerical HAV score
  havRaw: string;                  // Raw HAV value as provided
  havId: number | null;            // Official HAV ID (can be null)
  lastDevelopmentProgram: string;  // Name of the last development program attended
  developmentProgramStatus: DevelopmentProgramStatus; // Status of that program
  developmentProgramPeriod: string; // Period of the development program
  golongan: string;                // Golongan (rank)
  kpiMidYear: number | null;      // KPI Mid Year score
  kpiFullYear: number | null;     // KPI Full Year score
  pk2023: PkRating | null;        // PK rating for 2023
  pk2024: PkRating | null;        // PK rating for 2024
  pk2025: PkRating | null;        // PK rating for 2025
  photoUrl: string;                // URL to employee photo
  strength1: string;               // First strength descriptor
  strength2: string;               // Second strength descriptor
  developmentArea1: string;        // First development area
  developmentArea2: string;        // Second development area
  educationLevel: string;          // Highest education level
  educationInstitution: string;    // Institution of highest education
  masaKerjaTotal: string;          // Total tenure (as stored in CSV, e.g., "24-12")
  masaKerjaJabatan: string;        // Tenure in current position
  masaKerjaCabang: string;         // Tenure in current branch
};

