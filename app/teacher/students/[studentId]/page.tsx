import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherStudentDetail } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "学生详情" };

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <RoleShell roleId="teacher"><TeacherStudentDetail studentId={studentId} /></RoleShell>;
}
