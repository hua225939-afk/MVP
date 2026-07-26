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

export type CourseProgress = {
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

export const courseProgressSchema = z
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
export const PROGRESS_UPDATED_EVENT = "vibe-coding:progress-updated";
const epoch = new Date(0).toISOString();

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

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

function storageKey(courseId: string, studentId = DEMO_STUDENT_ID) {
  return `${PROGRESS_PREFIX}${studentId}:${courseId}`;
}

function browserStorage(): ProgressStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readCourseProgressRecord(
  courseId: string,
  storage: ProgressStorage | null,
  studentId = DEMO_STUDENT_ID,
): CourseProgress {
  const empty: CourseProgress = {
    schemaVersion: 1,
    studentId,
    courseId,
    lessons: {},
  };
  if (!storage) return empty;

  try {
    const saved = storage.getItem(storageKey(courseId, studentId));
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

function migrateLegacyProgress(
  lesson: Lesson,
  storage: ProgressStorage | null,
): LessonProgress | null {
  if (!storage) return null;
  try {
    const saved = storage.getItem(`${LEGACY_PROGRESS_PREFIX}${lesson.id}`);
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
  return new LearningProgressRepository(browserStorage()).readLesson(
    courseId,
    lesson,
  );
}

function normalizeLessonProgress(
  courseProgress: CourseProgress,
  lesson: Lesson,
): LessonProgress | null {
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

  return null;
}

export function writeProgress(
  courseId: string,
  lessonId: string,
  progress: LessonProgress,
) {
  new LearningProgressRepository(browserStorage()).writeLesson(
    courseId,
    lessonId,
    progress,
  );
}

export function progressPercent(progress: LessonProgress, totalSteps = 6) {
  return Math.round(
    (Math.min(progress.completedStepIds.length, totalSteps) / totalSteps) * 100,
  );
}

export function readCourseProgressSummary(
  courseId: string,
  totalLessons = 13,
) {
  return new LearningProgressRepository(browserStorage()).summary(
    courseId,
    totalLessons,
  );
}

export class LearningProgressRepository {
  private readonly storage: ProgressStorage | null;
  private readonly studentId: string;

  constructor(
    storage: ProgressStorage | null,
    studentId = DEMO_STUDENT_ID,
  ) {
    this.storage = storage;
    this.studentId = studentId;
  }

  readCourse(courseId: string): CourseProgress {
    const record = readCourseProgressRecord(
      courseId,
      this.storage,
      this.studentId,
    );
    if (record.studentId !== this.studentId) {
      return {
        schemaVersion: 1,
        studentId: this.studentId,
        courseId,
        lessons: {},
      };
    }
    return record;
  }

  readLesson(courseId: string, lesson: Lesson): LessonProgress {
    const current = this.readCourse(courseId);
    const normalized = normalizeLessonProgress(current, lesson);
    if (normalized) return normalized;
    const legacy = migrateLegacyProgress(lesson, this.storage);
    if (legacy) {
      this.writeLesson(courseId, lesson.id, legacy);
      return legacy;
    }
    return emptyProgress(lesson);
  }

  writeLesson(
    courseId: string,
    lessonId: string,
    progress: LessonProgress,
  ) {
    if (!this.storage) return;
    const current = this.readCourse(courseId);
    const next = courseProgressSchema.parse({
      ...current,
      lessons: { ...current.lessons, [lessonId]: progress },
    });
    this.storage.setItem(
      storageKey(courseId, this.studentId),
      JSON.stringify(next),
    );
    if (
      typeof window !== "undefined" &&
      typeof window.dispatchEvent === "function"
    ) {
      window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT));
    }
  }

  summary(courseId: string, totalLessons = 13) {
    const courseProgress = this.readCourse(courseId);
  const lessons = Object.entries(courseProgress.lessons);
  const completedLessons = lessons.filter(
    ([, lesson]) => lesson.status === "completed",
  ).length;
  const current =
    [...lessons]
      .filter(([, lesson]) => lesson.status !== "completed")
      .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
    [...lessons].sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return {
    completedLessons,
    currentLessonId: current?.[0] ?? "lesson-01",
    percent: Math.round(
      (Math.min(completedLessons, totalLessons) / totalLessons) * 100,
    ),
    totalLessons,
  };
  }
}

export function getBrowserLearningProgressRepository(
  studentId = DEMO_STUDENT_ID,
) {
  const storage = browserStorage();
  return storage
    ? new LearningProgressRepository(storage, studentId)
    : null;
}
