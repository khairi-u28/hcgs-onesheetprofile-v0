import { EmployeeProfileFoundationView } from "@/features/employees/views/employee-profile-foundation-view";

export default async function EmployeeProfilePage(
  props: PageProps<"/employees/[nrp]">,
) {
  const { nrp } = await props.params;

  return <EmployeeProfileFoundationView nrp={nrp} />;
}
