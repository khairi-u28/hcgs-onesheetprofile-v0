import { RegionFoundationView } from "@/features/organization/views/region-foundation-view";

export default async function RegionPage(
  props: PageProps<"/regions/[regionId]">,
) {
  const { regionId } = await props.params;

  return <RegionFoundationView regionId={regionId} />;
}
