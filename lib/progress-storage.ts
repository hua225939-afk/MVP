export type InteractionProgress = {
  value?: string | boolean;
  completed: boolean;
  correct?: boolean;
};

export type LessonProgress = {
  currentStep: number;
  completedSteps: string[];
  interactions: Record<string, InteractionProgress>;
  updatedAt: string;
};

export const PROGRESS_PREFIX = "vibe-course-progress:";

export function emptyProgress(): LessonProgress {
  return {
    currentStep: 0,
    completedSteps: [],
    interactions: {},
    updatedAt: new Date(0).toISOString(),
  };
}

export function readProgress(lessonId: string): LessonProgress {
  if (typeof window === "undefined") return emptyProgress();

  try {
    const saved = window.localStorage.getItem(`${PROGRESS_PREFIX}${lessonId}`);
    if (!saved) return emptyProgress();
    const parsed = JSON.parse(saved) as Partial<LessonProgress>;
    return {
      currentStep:
        typeof parsed.currentStep === "number"
          ? Math.max(0, Math.min(5, parsed.currentStep))
          : 0,
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.filter((item): item is string => typeof item === "string")
        : [],
      interactions:
        parsed.interactions && typeof parsed.interactions === "object"
          ? parsed.interactions
          : {},
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(lessonId: string, progress: LessonProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${PROGRESS_PREFIX}${lessonId}`,
    JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }),
  );
}

export function progressPercent(progress: LessonProgress) {
  return Math.round((Math.min(progress.completedSteps.length, 6) / 6) * 100);
}
