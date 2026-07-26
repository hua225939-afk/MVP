import { DashboardHeader, DemoNotice } from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { ProjectList } from "@/components/workbench/ProjectList";

export default function ProjectsPage() {
  return (
    <RoleShell roleId="student">
      <DashboardHeader
        action={{ label: "返回学习中心", href: "/student/courses" }}
        description="打开同一个持续项目，查看它的修订、测试和版本快照。"
        eyebrow="造物星球 · 我的作品"
        title="我的造物项目"
      />
      <DemoNotice>
        项目保存在当前浏览器。课程页与创造台通过统一 ProjectRepository 读写同一份 ProjectDocument。
      </DemoNotice>
      <ProjectList />
    </RoleShell>
  );
}
