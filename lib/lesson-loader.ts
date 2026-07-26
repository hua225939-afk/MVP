/// <reference types="vite/client" />

import courseContent from "@/content/courses/vibe-coding-foundations.json";
import {
  courseSchema,
  lessonSchema,
  type Course,
  type Lesson,
} from "@/lib/lesson-schema";

type JsonModule = { default: unknown };

const lessonModules = import.meta.glob<JsonModule>(
  "../content/lessons/lesson-*.json",
  { eager: true },
);

export const course: Course = courseSchema.parse(courseContent);

export function validateCourseLessonReferences(
  courseValue: Course,
  lessonValues: Lesson[],
) {
  const unitByLessonId = new Map(
    courseValue.units.flatMap((unit) =>
      unit.lessonIds.map((lessonId) => [lessonId, unit.id] as const),
    ),
  );
  const seen = new Set<string>();

  for (const lesson of lessonValues) {
    if (seen.has(lesson.id)) {
      throw new Error(`课次重复注册：${lesson.id}`);
    }
    seen.add(lesson.id);
    if (lesson.courseId !== courseValue.id) {
      throw new Error(`${lesson.id} 的 courseId 与课程清单不一致`);
    }
    if (unitByLessonId.get(lesson.id) !== lesson.unitId) {
      throw new Error(`${lesson.id} 的 unitId 与课程清单不一致`);
    }
  }
}

export const lessons: Lesson[] = Object.values(lessonModules)
  .map((module) => lessonSchema.parse(module.default))
  .sort((a, b) => a.order - b.order);

validateCourseLessonReferences(course, lessons);

export function getLesson(lessonId: string) {
  return lessons.find((lesson) => lesson.id === lessonId);
}

const unitColors = new Map(
  course.units.map((unit, index) => [
    unit.id,
    ["#7C3AED", "#2563EB", "#6D28D9", "#0F766E", "#C2410C"][index],
  ]),
);

export const lessonSummaries = lessons.map((lesson) => ({
  id: lesson.id,
  order: lesson.order,
  title: lesson.title,
  subtitle: lesson.subtitle,
  studentSubtitle: lesson.studentSubtitle,
  description: lesson.coreGoal,
  duration: `${lesson.durationMinutes} 分钟`,
  level: "样板课",
  badge: lesson.unitId === "unit-01" ? "认识 Vibe Coding" : "让网页动起来",
  color: unitColors.get(lesson.unitId) ?? "#7C3AED",
  skills: lesson.skills,
  output: lesson.output,
  parentSummary: lesson.parentSummary,
}));
