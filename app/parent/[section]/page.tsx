import { RoleSectionPage } from "@/components/platform/RoleSectionPage";
import { RoleShell } from "@/components/platform/RoleShell";

export default async function ParentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <RoleShell roleId="parent"><RoleSectionPage roleId="parent" section={section} /></RoleShell>;
}
