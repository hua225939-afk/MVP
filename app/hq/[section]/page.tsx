import { RoleSectionPage } from "@/components/platform/RoleSectionPage";
import { RoleShell } from "@/components/platform/RoleShell";

export default async function HqSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <RoleShell roleId="hq"><RoleSectionPage roleId="hq" section={section} /></RoleShell>;
}
