import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";

export default async function WorkbenchPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <WorkbenchShell projectId={projectId} />;
}
