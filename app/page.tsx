import { CourseHome } from "@/components/course/CourseHome";
import { lessonSummaries } from "@/lib/lesson-loader";

export default function Home() {
  return <CourseHome lessons={lessonSummaries} />;
}
