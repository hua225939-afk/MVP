import { RoleSectionPage } from "@/components/platform/RoleSectionPage";
import { RoleShell } from "@/components/platform/RoleShell";

export default async function PartnerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <RoleShell roleId="partner"><RoleSectionPage roleId="partner" section={section} /></RoleShell>;
}
