import { RoleDashboard } from "@/components/platform/RoleDashboard";
import { RoleShell } from "@/components/platform/RoleShell";

export const metadata = { title: "合作伙伴" };

export default function PartnerPage() {
  return (
    <RoleShell roleId="partner">
      <RoleDashboard role="partner" />
    </RoleShell>
  );
}
