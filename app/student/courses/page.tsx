import { CourseHome } from "@/components/course/CourseHome";
import { lessonSummaries } from "@/lib/lesson-loader";

export default function StudentCoursesPage() {
  return <CourseHome lessons={lessonSummaries} />;
}
