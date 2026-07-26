import { RoleShell } from "@/components/platform/RoleShell";
import { StudentCreationBase } from "@/components/workbench/StudentCreationBase";
import { getDemoStudentProfile } from "@/data/mock/platform-data";
import { lessonSummaries } from "@/lib/lesson-loader";

export default function StudentPage() {
  const student = getDemoStudentProfile();

  return (
    <RoleShell roleId="student">
      <StudentCreationBase lessons={lessonSummaries} studentName={student.name} />
    </RoleShell>
  );
}
