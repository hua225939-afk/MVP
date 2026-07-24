import lesson01 from "@/content/lessons/lesson-01.json";
import lesson02 from "@/content/lessons/lesson-02.json";
import lesson03 from "@/content/lessons/lesson-03.json";
import { lessonSchema, type Lesson } from "@/lib/lesson-schema";

const rawLessons: unknown[] = [lesson01, lesson02, lesson03];

export const lessons: Lesson[] = rawLessons
  .map((lesson) => lessonSchema.parse(lesson))
  .sort((a, b) => a.order - b.order);

export function getLesson(lessonId: string) {
  return lessons.find((lesson) => lesson.id === lessonId);
}

export const lessonSummaries = lessons.map(
  ({ id, order, title, subtitle, description, duration, level, badge, color, skills }) => ({
    id,
    order,
    title,
    subtitle,
    description,
    duration,
    level,
    badge,
    color,
    skills,
  }),
);
