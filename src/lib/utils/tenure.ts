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

function normalizeCsvTenure(csvVal: string | null | undefined): string | null {
  if (!csvVal || csvVal.trim() === "") return null;
  const val = csvVal.trim();
  const match = val.match(/^(\d{1,2})[-.](\d{1,2})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  }
  return null;
}

export function getMasaKerjaTotal(entryDate: string | null | undefined, csvTotal: string | null | undefined): string {
  const normalized = normalizeCsvTenure(csvTotal);
  if (normalized) return normalized;
  
  const calc = calculateTenureFromDate(entryDate);
  return calc ?? "--";
}

export function getMasaKerjaJabatan(
    pos: string, 
    csvJabatan: string | null | undefined, 
    workHistory: WorkHistoryRecord[]
): string {
  const normalized = normalizeCsvTenure(csvJabatan);
  if (normalized) return normalized;

  // Filter for matching POS
  const matchingRecords = workHistory.filter(w => w.pos === pos);
  if (matchingRecords.length > 0) {
      // Get earliest start date of contiguous or latest block? Let's just use the latest record's start date
      const latest = matchingRecords.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  
  // Fallback to latest work history
  if (workHistory.length > 0) {
      const latest = workHistory.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
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
  const normalized = normalizeCsvTenure(csvCabang);
  if (normalized) return normalized;

  const matchingRecords = workHistory.filter(w => w.branchCode === branchCode);
  if (matchingRecords.length > 0) {
      const latest = matchingRecords.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  
  // Fallback to latest work history
  if (workHistory.length > 0) {
      const latest = workHistory.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      const calc = calculateTenureFromDate(latest.startDate);
      if (calc) return calc;
  }
  return "--";
}
