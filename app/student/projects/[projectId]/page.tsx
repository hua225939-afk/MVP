import { DashboardHeader } from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { ProjectDetails } from "@/components/workbench/ProjectDetails";
import { brand } from "@/config/brand";

export const metadata = {
  title: `作品详情 · ${brand.projectLibraryName}`,
};

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <RoleShell roleId="student">
      <DashboardHeader
        action={{ label: `返回${brand.projectLibraryName}`, href: "/student/projects" }}
        description="查看持续项目的数据摘要与造物轨迹。"
        eyebrow={`${brand.studentSpaceName} · 项目档案`}
        title="作品详情"
      />
      <ProjectDetails projectId={projectId} />
    </RoleShell>
  );
}
