import { z } from "zod";

export const organizationBranchSchema = z.object({
  region: z.string().trim().min(1),
  area: z.string().trim().min(1),
  branchCode: z.string().trim().min(1),
  branchName: z.string().trim().min(1),
  branchType: z.string().trim().min(1),
});

export const organizationDatasetSchema = z.array(organizationBranchSchema);
