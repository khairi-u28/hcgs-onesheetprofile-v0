import { BranchFoundationView } from "@/features/organization/views/branch-foundation-view";

export default async function BranchPage(
  props: PageProps<"/branches/[branchCode]">,
) {
  const { branchCode } = await props.params;

  return <BranchFoundationView branchCode={branchCode} />;
}
