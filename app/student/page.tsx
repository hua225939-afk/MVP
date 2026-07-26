import { RoleShell } from "@/components/platform/RoleShell";
import { StudentCreationBase } from "@/components/workbench/StudentCreationBase";
import { brand } from "@/config/brand";
import { lessonSummaries } from "@/lib/lesson-loader";
import { demoIdentities } from "@/lib/platform/demo-identities";

export const metadata = { title: brand.studentSpaceName };

export default function StudentPage() {
  return (
    <RoleShell roleId="student">
      <StudentCreationBase
        lessons={lessonSummaries}
        studentName={demoIdentities.student.name}
      />
    </RoleShell>
  );
}
