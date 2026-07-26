import { PublicProjectPage } from "@/components/publication/PublicProjectPage";

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <PublicProjectPage projectId={projectId} />;
}
