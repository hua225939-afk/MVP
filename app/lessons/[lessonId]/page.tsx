import { notFound } from "next/navigation";
import { LessonExperience } from "@/components/lesson/LessonExperience";
import { getLesson, lessons } from "@/lib/lesson-loader";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);

  if (!lesson) notFound();

  return <LessonExperience lesson={lesson} />;
}
