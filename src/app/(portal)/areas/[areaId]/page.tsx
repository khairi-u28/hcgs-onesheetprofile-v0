import { AreaFoundationView } from "@/features/organization/views/area-foundation-view";

export default async function AreaPage(props: PageProps<"/areas/[areaId]">) {
  const { areaId } = await props.params;

  return <AreaFoundationView areaId={areaId} />;
}
