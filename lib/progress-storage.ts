import { z } from "zod";
import type { Lesson } from "@/lib/lesson-schema";

export type InteractionProgress = {
  value?: string | boolean;
  completed: boolean;
  correct?: boolean;
  attempts: number;
  updatedAt: string;
};

export type LessonProgress = {
  status: "not_started" | "in_progress" | "completed";
  currentStepId: string;
  completedStepIds: string[];
  interactions: Record<string, InteractionProgress>;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
};

type CourseProgress = {
  schemaVersion: 1;
  studentId: string;
  courseId: string;
  lessons: Record<string, LessonProgress>;
};

const interactionProgressSchema = z
  .object({
    value: z.union([z.string(), z.boolean()]).optional(),
    completed: z.boolean(),
    correct: z.boolean().optional(),
    attempts: z.number().int().nonnegative(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

const lessonProgressSchema = z
  .object({
    status: z.enum(["not_started", "in_progress", "completed"]),
    currentStepId: z.string().min(1),
    completedStepIds: z.array(z.string().min(1)),
    interactions: z.record(z.string(), interactionProgressSchema),
    startedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .strict();

const courseProgressSchema = z
  .object({
    schemaVersion: z.literal(1),
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    lessons: z.record(z.string(), lessonProgressSchema),
  })
  .strict();

export const DEMO_STUDENT_ID = "student-an";
export const PROGRESS_PREFIX = "vibe-coding:v1:progress:";
const LEGACY_PROGRESS_PREFIX = "vibe-course-progress:";
const epoch = new Date(0).toISOString();

export function emptyProgress(lesson: Lesson): LessonProgress {
  return {
    status: "not_started",
    currentStepId: lesson.steps[0].id,
    completedStepIds: [],
    interactions: {},
    startedAt: null,
    updatedAt: epoch,
    completedAt: null,
  };
}

function storageKey(courseId: string) {
  return `${PROGRESS_PREFIX}${DEMO_STUDENT_ID}:${courseId}`;
}

function readCourseProgress(courseId: string): CourseProgress {
  const empty: CourseProgress = {
    schemaVersion: 1,
    studentId: DEMO_STUDENT_ID,
    courseId,
    lessons: {},
  };
  if (typeof window === "undefined") return empty;

  try {
    const saved = window.localStorage.getItem(storageKey(courseId));
    if (!saved) return empty;
    const result = courseProgressSchema.safeParse(JSON.parse(saved));
    if (!result.success) {
      console.warn("忽略损坏或不兼容的学习进度", result.error.issues);
      return empty;
    }
    return result.data;
  } catch {
    return empty;
  }
}

function migrateLegacyProgress(lesson: Lesson): LessonProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(`${LEGACY_PROGRESS_PREFIX}${lesson.id}`);
    if (!saved) return null;
    const legacy = JSON.parse(saved) as {
      currentStep?: unknown;
      completedSteps?: unknown;
      interactions?: unknown;
      updatedAt?: unknown;
    };
    const currentIndex =
      typeof legacy.currentStep === "number"
        ? Math.max(0, Math.min(lesson.steps.length - 1, legacy.currentStep))
        : 0;
    const validStepIds = new Set(lesson.steps.map((step) => step.id));
    const completedStepIds = Array.isArray(legacy.completedSteps)
      ? legacy.completedSteps.filter(
          (stepId): stepId is string =>
            typeof stepId === "string" && validStepIds.has(stepId),
        )
      : [];
    const timestamp =
      typeof legacy.updatedAt === "string" &&
      !Number.isNaN(Date.parse(legacy.updatedAt))
        ? new Date(legacy.updatedAt).toISOString()
        : new Date().toISOString();
    const rawInteractions =
      legacy.interactions && typeof legacy.interactions === "object"
        ? (legacy.interactions as Record<string, unknown>)
        : {};
    const interactions = Object.fromEntries(
      Object.entries(rawInteractions).flatMap(([id, raw]) => {
        if (!raw || typeof raw !== "object") return [];
        const item = raw as { value?: unknown; completed?: unknown; correct?: unknown };
        if (typeof item.completed !== "boolean") return [];
        if (
          item.value !== undefined &&
          typeof item.value !== "string" &&
          typeof item.value !== "boolean"
        ) {
          return [];
        }
        return [
          [
            id,
            {
              value: item.value,
              completed: item.completed,
              correct: typeof item.correct === "boolean" ? item.correct : undefined,
              attempts: 1,
              updatedAt: timestamp,
            },
          ],
        ];
      }),
    );
    return {
      status:
        completedStepIds.length === lesson.steps.length ? "completed" : "in_progress",
      currentStepId: lesson.steps[currentIndex].id,
      completedStepIds,
      interactions,
      startedAt: timestamp,
      updatedAt: timestamp,
      completedAt:
        completedStepIds.length === lesson.steps.length ? timestamp : null,
    };
  } catch {
    return null;
  }
}

export function readProgress(courseId: string, lesson: Lesson): LessonProgress {
  const courseProgress = readCourseProgress(courseId);
  const saved = courseProgress.lessons[lesson.id];
  const validStepIds = new Set(lesson.steps.map((step) => step.id));

  if (saved && validStepIds.has(saved.currentStepId)) {
    const completedStepIds = saved.completedStepIds.filter((stepId) => {
      const step = lesson.steps.find((item) => item.id === stepId);
      return (
        step &&
        step.completion.requiredAtomIds.every(
          (atomId) => saved.interactions[atomId]?.completed,
        )
      );
    });
    const lessonComplete = completedStepIds.length === lesson.steps.length;
    return {
      ...saved,
      status: lessonComplete
        ? "completed"
        : completedStepIds.length > 0
          ? "in_progress"
          : "not_started",
      completedStepIds,
      completedAt: lessonComplete ? saved.completedAt : null,
    };
  }

  const legacy = migrateLegacyProgress(lesson);
  if (legacy) {
    writeProgress(courseId, lesson.id, legacy);
    return legacy;
  }
  return emptyProgress(lesson);
}

export function writeProgress(
  courseId: string,
  lessonId: string,
  progress: LessonProgress,
) {
  if (typeof window === "undefined") return;
  const current = readCourseProgress(courseId);
  const next: CourseProgress = {
    ...current,
    lessons: { ...current.lessons, [lessonId]: progress },
  };
  window.localStorage.setItem(storageKey(courseId), JSON.stringify(next));
}

export function progressPercent(progress: LessonProgress, totalSteps = 6) {
  return Math.round(
    (Math.min(progress.completedStepIds.length, totalSteps) / totalSteps) * 100,
  );
}
