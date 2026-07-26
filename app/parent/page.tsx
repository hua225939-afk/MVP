import { RoleDashboard } from "@/components/platform/RoleDashboard";
import { RoleShell } from "@/components/platform/RoleShell";

export const metadata = { title: "家长" };

export default function ParentPage() {
  return (
    <RoleShell roleId="parent">
      <RoleDashboard role="parent" />
    </RoleShell>
  );
}
