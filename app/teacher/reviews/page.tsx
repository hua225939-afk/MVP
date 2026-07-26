import { RoleShell } from "@/components/platform/RoleShell";
import { TeacherReviews } from "@/components/platform/TeacherWorkspace";

export const metadata = { title: "点评待办" };

export default function TeacherReviewsPage() {
  return <RoleShell roleId="teacher"><TeacherReviews /></RoleShell>;
}
