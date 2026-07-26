import { z } from "zod";
import type { ProjectStorage } from "../projects/project-repository.ts";

const isoDate = z.iso.datetime();

const teacherFeedbackSchema = z.object({
  id: z.string().min(1),
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  summary: z.string().trim().min(2).max(300),
  strengths: z.string().max(300).default(""),
  suggestion: z.string().max(300).default(""),
  lessonId: z.string().nullable().default(null),
  evidenceId: z.string().nullable().default(null),
  mark: z.enum(["doing_well", "needs_attention"]).default("doing_well"),
  status: z.enum(["pending", "needs_recheck", "completed"]).default("completed"),
  visibility: z.literal("student_and_parent"),
  isDemo: z.literal(true),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const attentionSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["needs_attention", "doing_well"]),
  updatedAt: isoDate,
});

export const platformStateSchema = z.object({
  schemaVersion: z.literal(1),
  teacherFeedback: z.array(teacherFeedbackSchema),
  studentAttention: z.array(attentionSchema),
});

export type PlatformState = z.infer<typeof platformStateSchema>;
export type TeacherFeedback = z.infer<typeof teacherFeedbackSchema>;
export type StudentAttention = z.infer<typeof attentionSchema>["status"] | null;

export const PLATFORM_STATE_KEY = "vibe-coding:v1:platform-state";
export const PLATFORM_BACKUP_PREFIX = "vibe-coding:v1:platform-backup:";
export const PLATFORM_UPDATED_EVENT = "vibe-coding:platform-updated";

const emptyState = (): PlatformState => ({
  schemaVersion: 1,
  teacherFeedback: [],
  studentAttention: [],
});

function createId(prefix: string, now: string) {
  return `${prefix}-${Date.parse(now)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class PlatformRepository {
  private readonly storage: ProjectStorage;
  private readonly now: () => string;

  constructor(
    storage: ProjectStorage,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.storage = storage;
    this.now = now;
  }

  read(): PlatformState {
    const raw = this.storage.getItem(PLATFORM_STATE_KEY);
    if (!raw) return emptyState();
    try {
      const parsed = JSON.parse(raw) as unknown;
      const current = platformStateSchema.safeParse(parsed);
      if (current.success) return current.data;
      const migrated = this.migrate(parsed);
      this.storage.setItem(PLATFORM_STATE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      this.storage.setItem(
        `${PLATFORM_BACKUP_PREFIX}corrupt:${Date.now()}`,
        raw,
      );
      return emptyState();
    }
  }

  listFeedback(studentId: string) {
    return this.read().teacherFeedback
      .filter((item) => item.studentId === studentId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  listAllFeedback() {
    return this.read().teacherFeedback.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  saveTeacherFeedback(input: {
    teacherId: string;
    studentId: string;
    summary: string;
    strengths?: string;
    suggestion?: string;
    lessonId?: string | null;
    evidenceId?: string | null;
    mark?: "doing_well" | "needs_attention";
    status?: "pending" | "needs_recheck" | "completed";
  }) {
    const state = this.read();
    const timestamp = this.now();
    const existing = state.teacherFeedback.find(
      (item) =>
        item.teacherId === input.teacherId &&
        item.studentId === input.studentId &&
        (input.evidenceId ? item.evidenceId === input.evidenceId : true),
    );
    const feedback = teacherFeedbackSchema.parse({
      id: existing?.id ?? createId("teacher-feedback", timestamp),
      teacherId: input.teacherId,
      studentId: input.studentId,
      summary: input.summary,
      strengths: input.strengths ?? existing?.strengths ?? "",
      suggestion: input.suggestion ?? existing?.suggestion ?? "",
      lessonId: input.lessonId ?? existing?.lessonId ?? null,
      evidenceId: input.evidenceId ?? existing?.evidenceId ?? null,
      mark: input.mark ?? existing?.mark ?? "doing_well",
      status: input.status ?? existing?.status ?? "completed",
      visibility: "student_and_parent",
      isDemo: true,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
    this.write({
      ...state,
      teacherFeedback: [
        ...state.teacherFeedback.filter((item) => item.id !== feedback.id),
        feedback,
      ],
    });
    return feedback;
  }

  setAttention(studentId: string, status: StudentAttention) {
    const state = this.read();
    this.write({
      ...state,
      studentAttention: status
        ? [
            ...state.studentAttention.filter(
              (item) => item.studentId !== studentId,
            ),
            { studentId, status, updatedAt: this.now() },
          ]
        : state.studentAttention.filter((item) => item.studentId !== studentId),
    });
  }

  getAttention(studentId: string): StudentAttention {
    return (
      this.read().studentAttention.find((item) => item.studentId === studentId)
        ?.status ?? null
    );
  }

  private migrate(input: unknown): PlatformState {
    if (!input || typeof input !== "object") return emptyState();
    const legacy = input as {
      schemaVersion?: unknown;
      teacherFeedback?: unknown;
      feedback?: unknown;
      studentAttention?: unknown;
    };
    if (
      legacy.schemaVersion !== undefined &&
      legacy.schemaVersion !== 0 &&
      legacy.schemaVersion !== 1
    ) {
      throw new Error("平台数据版本不受支持");
    }
    return platformStateSchema.parse({
      schemaVersion: 1,
      teacherFeedback: Array.isArray(legacy.teacherFeedback)
        ? legacy.teacherFeedback
        : Array.isArray(legacy.feedback)
          ? legacy.feedback
          : [],
      studentAttention: Array.isArray(legacy.studentAttention)
        ? legacy.studentAttention
        : [],
    });
  }

  private write(state: PlatformState) {
    const validated = platformStateSchema.parse(state);
    this.storage.setItem(PLATFORM_STATE_KEY, JSON.stringify(validated));
    if (
      typeof window !== "undefined" &&
      typeof window.dispatchEvent === "function"
    ) {
      window.dispatchEvent(new CustomEvent(PLATFORM_UPDATED_EVENT));
    }
  }
}

export function getBrowserPlatformRepository() {
  return typeof window === "undefined"
    ? null
    : new PlatformRepository(window.localStorage);
}
