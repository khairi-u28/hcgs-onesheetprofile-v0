export type WorkHistoryRecord = {
  nrp: string;
  position: string;
  pos?: string;
  branchCode: string | null;
  branchName: string | null;
  startDate: any; // ISO string, can be null
  endDate: any; // ISO string, can be null
};
