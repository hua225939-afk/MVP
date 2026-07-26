import { DashboardHeader, DemoNotice } from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { ProjectList } from "@/components/workbench/ProjectList";
import { brand } from "@/config/brand";

export const metadata = {
  title: brand.projectLibraryName,
};

export default function ProjectsPage() {
  return (
    <RoleShell roleId="student">
      <DashboardHeader
        action={{ label: `返回${brand.learningCenterName}`, href: "/student/courses" }}
        description="打开同一个持续项目，查看它的修订、测试和版本快照。"
        eyebrow={`${brand.studentSpaceName} · ${brand.projectLibraryName}`}
        title={brand.projectLibraryName}
      />
      <DemoNotice>
        项目保存在当前浏览器。课程页与创造台通过统一 ProjectRepository 读写同一份 ProjectDocument。
      </DemoNotice>
      <ProjectList />
    </RoleShell>
  );
}
