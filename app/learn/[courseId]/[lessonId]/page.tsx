import { notFound } from "next/navigation";
import { LessonExperience } from "@/components/lesson/LessonExperience";
import { getLesson, lessons } from "@/lib/lesson-loader";

const courseId = "vibe-coding-foundations";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ courseId, lessonId: lesson.id }));
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const route = await params;
  const query = await searchParams;
  if (route.courseId !== courseId) notFound();

  const lesson = getLesson(route.lessonId);
  if (!lesson) notFound();

  return <LessonExperience lesson={lesson} readOnly={query.mode === "preview"} />;
}
