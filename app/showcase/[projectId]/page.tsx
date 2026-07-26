import { PublicProjectPage } from "@/components/publication/PublicProjectPage";
import { brand } from "@/config/brand";

export const metadata = {
  title: `公开作品 · ${brand.galleryName}`,
};

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <PublicProjectPage projectId={projectId} />;
}
