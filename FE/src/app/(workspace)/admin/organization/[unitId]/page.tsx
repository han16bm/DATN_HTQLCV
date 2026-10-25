import { UnitEditorPage } from "@/features/organization/components/unit-editor-page";
export default async function Page({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  return <UnitEditorPage unitId={unitId} />;
}
