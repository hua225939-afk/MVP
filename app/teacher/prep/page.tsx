import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherStaticSection } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "备课与示范" };

export default function TeacherPrepPage() {
  return <RoleShell roleId="teacher"><TeacherStaticSection section="prep" /></RoleShell>;
}
