import { RoleSectionPage } from "@/components/platform/RoleSectionPage";
import { RoleShell } from "@/components/platform/RoleShell";

export default async function StudentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <RoleShell roleId="student"><RoleSectionPage roleId="student" section={section} /></RoleShell>;
}
