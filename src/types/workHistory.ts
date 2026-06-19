export type WorkHistoryRecord = {
  nrp: string;
  position: string;
  pos?: string;
  branchCode: string | null;
  branchName: string | null;
  startDate: string; // ISO string
  endDate: string; // ISO string
};
