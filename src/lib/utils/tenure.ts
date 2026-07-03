import { differenceInMonths, isValid, parseISO } from "date-fns";
import type { WorkHistoryRecord } from "@/types";

export function formatTenure(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${String(y).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
}

export function calculateTenureFromDate(startDateStr: string | null | undefined): string | null {
  if (!startDateStr) return null;
  const date = parseISO(startDateStr);
  if (!isValid(date)) return null;
  const diff = differenceInMonths(new Date(), date);
  return formatTenure(Math.max(0, diff));
}

const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

export function parseMasaKerja(rawVal: string | null | undefined): { normalized: string; raw: string } {
  const raw = (rawVal || "").trim();
  if (!raw) {
    return { normalized: "--", raw: "" };
  }

  // Check if it already matches YY-MM format
  const clean = raw.replace(/\s+/g, "");
  const digitMatch = clean.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (digitMatch) {
    const p1 = digitMatch[1].padStart(2, "0");
    const p2 = digitMatch[2].padStart(2, "0");
    return { normalized: `${p1}-${p2}`, raw };
  }

  // Check if it contains month names
  const parts = clean.split(/[-./]/);
  if (parts.length === 2) {
    let numPart: number | null = null;
    let monthPartVal: number | null = null;

    for (const part of parts) {
      const parsedNum = parseInt(part, 10);
      if (!isNaN(parsedNum) && String(parsedNum) === part) {
        numPart = parsedNum;
      } else {
        const lowerPart = part.toLowerCase();
        if (MONTH_MAP[lowerPart]) {
          monthPartVal = parseInt(MONTH_MAP[lowerPart], 10);
        }
      }
    }

    if (numPart !== null && monthPartVal !== null) {
      let year: number;
      let month: number;

      if (numPart > 12) {
        year = numPart;
        month = monthPartVal;
      } else {
        if (monthPartVal > numPart) {
          year = monthPartVal;
          month = numPart;
        } else {
          year = numPart;
          month = monthPartVal;
        }
      }

      const yStr = String(year).padStart(2, "0");
      const mStr = String(month).padStart(2, "0");
      return { normalized: `${yStr}-${mStr}`, raw };
    }
  }

  return { normalized: raw, raw };
}

export function getMasaKerjaTotal(entryDate: string | null | undefined, csvTotal: string | null | undefined): string {
  const { normalized } = parseMasaKerja(csvTotal);
  if (normalized !== "--") return normalized;
  
  const calc = calculateTenureFromDate(entryDate);
  return calc ?? "--";
}

export function getMasaKerjaJabatan(
    pos: string, 
    csvJabatan: string | null | undefined, 
    workHistory: WorkHistoryRecord[]
): string {
  const { normalized } = parseMasaKerja(csvJabatan);
  if (normalized !== "--") return normalized;

  // Filter for matching POS
  const matchingRecords = workHistory.filter(w => w.pos === pos);
  if (matchingRecords.length > 0) {
      // Get earliest start date of contiguous or latest block? Let's just use the latest record's start date
      const latest = [...matchingRecords].sort((a,b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  
  // Fallback to latest work history
  if (workHistory.length > 0) {
      const latest = [...workHistory].sort((a,b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  return "--";
}

export function getMasaKerjaCabang(
    branchCode: string, 
    csvCabang: string | null | undefined, 
    workHistory: WorkHistoryRecord[]
): string {
  const { normalized } = parseMasaKerja(csvCabang);
  if (normalized !== "--") return normalized;

  const matchingRecords = workHistory.filter(w => w.branchCode === branchCode);
  if (matchingRecords.length > 0) {
      const latest = [...matchingRecords].sort((a,b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  
  // Fallback to latest work history
  if (workHistory.length > 0) {
      const latest = [...workHistory].sort((a,b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  return "--";
}
