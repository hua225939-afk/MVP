import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherEvidence } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "项目证据" };

export default function TeacherEvidencePage() {
  return <RoleShell roleId="teacher"><TeacherEvidence /></RoleShell>;
}
