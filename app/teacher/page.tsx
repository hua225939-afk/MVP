import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherOverview } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "教师" };

export default function TeacherPage() {
  return (
    <RoleShell roleId="teacher">
      <TeacherOverview />
    </RoleShell>
  );
}
