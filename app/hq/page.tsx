import { RoleDashboard } from "@/components/platform/RoleDashboard";
import { RoleShell } from "@/components/platform/RoleShell";

export const metadata = { title: "总部" };

export default function HeadquartersPage() {
  return (
    <RoleShell roleId="hq">
      <RoleDashboard role="hq" />
    </RoleShell>
  );
}
