import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { brand } from "@/config/brand";

export const metadata = {
  title: `${brand.workbenchName} · ${brand.studentSpaceName}`,
};

export default async function WorkbenchPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <WorkbenchShell projectId={projectId} />;
}
