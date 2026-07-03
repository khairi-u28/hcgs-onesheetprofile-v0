export type WorkHistoryRecord = {
  nrp: string;
  position: string;
  pos?: string;
  branchCode: string | null;
  branchName: string | null;
  /** Normalized ISO date string. When isCurrent=true, this is set to today's date so duration math never produces NaN. */
  startDate: string | null;
  /** Normalized ISO date string. When isCurrent=true, this is set to today's date (not null), so duration math always works. */
  endDate: string | null;
  /** True when the original End Date value was NOW, CURRENT, or ACTIVE. */
  isCurrent: boolean;
  /** The original raw End Date value as imported (e.g. "NOW", "CURRENT", "ACTIVE"). Null when not a current-position marker. */
  rawEndDate: string | null;
};
