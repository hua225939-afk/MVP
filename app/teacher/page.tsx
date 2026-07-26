import { RoleDashboard } from "@/components/platform/RoleDashboard";
import { RoleShell } from "@/components/platform/RoleShell";

export const metadata = { title: "教师" };

export default function TeacherPage() {
  return (
    <RoleShell roleId="teacher">
      <RoleDashboard role="teacher" />
    </RoleShell>
  );
}
