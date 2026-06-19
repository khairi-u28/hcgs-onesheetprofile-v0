export type OrganizationBranch = {
  region: string;
  area: string;
  branchCode: string;
  branchName: string;
  branchType: string;
};

export type OrganizationFilters = {
  region?: string;
  area?: string;
};
