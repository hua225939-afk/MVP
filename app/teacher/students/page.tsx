import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherStudents } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "学生进度" };

export default function TeacherStudentsPage() {
  return <RoleShell roleId="teacher"><TeacherStudents /></RoleShell>;
}
