import { CourseHome } from "@/components/course/CourseHome";
import { brand } from "@/config/brand";
import { lessonSummaries } from "@/lib/lesson-loader";

export const metadata = {
  title: `${brand.learningCenterName} · ${brand.courseSeriesName}`,
};

export default function StudentCoursesPage() {
  return <CourseHome lessons={lessonSummaries} />;
}
