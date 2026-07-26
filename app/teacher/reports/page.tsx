import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherStaticSection } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "成长报告" };

export default function TeacherReportsPage() {
  return <RoleShell roleId="teacher"><TeacherStaticSection section="reports" /></RoleShell>;
}
