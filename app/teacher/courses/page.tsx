import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherCourses } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "我的课程" };

export default function TeacherCoursesPage() {
  return <RoleShell roleId="teacher"><TeacherCourses /></RoleShell>;
}
