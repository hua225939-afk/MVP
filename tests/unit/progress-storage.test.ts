import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import {
  emptyProgress,
  readCourseProgressSummary,
  readProgress,
  writeProgress,
} from "../../lib/progress-storage.ts";

test("结构化选择、输入、测试与修改记录可保存并恢复", () => {
  const lesson = lessonSchema.parse(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), "content/lessons/lesson-01.json"),
        "utf8",
      ),
    ),
  );
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });

  const now = new Date().toISOString();
  const progress = {
    ...emptyProgress(lesson),
    status: "in_progress" as const,
    currentStepId: "lesson-01.make",
    interactions: {
      "lesson-01.make.builder": {
        value: JSON.stringify({
          schemaVersion: 1,
          fields: { direction: "学习提醒", "app-name": "专注起航站" },
          generatedCode: "<h1>今晚完成复习</h1>",
          changeCount: 7,
          savedAt: now,
        }),
        completed: true,
        correct: true,
        attempts: 8,
        updatedAt: now,
      },
      "lesson-01.test.flight-scan": {
        value: "<h1>今晚完成复习</h1>",
        completed: false,
        correct: false,
        attempts: 1,
        updatedAt: now,
      },
    },
    updatedAt: now,
  };

  writeProgress(lesson.courseId, lesson.id, progress);
  const restored = readProgress(lesson.courseId, lesson);
  assert.equal(restored.currentStepId, "lesson-01.make");
  assert.equal(
    restored.interactions["lesson-01.make.builder"].value,
    progress.interactions["lesson-01.make.builder"].value,
  );
  assert.equal(
    restored.interactions["lesson-01.test.flight-scan"].correct,
    false,
  );
  assert.equal(
    restored.interactions["lesson-01.make.builder"].attempts,
    8,
  );

  Reflect.deleteProperty(globalThis, "window");
});

test("创造基地的 13 课进度来自真实课程进度存储", () => {
  const lesson01 = lessonSchema.parse(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), "content/lessons/lesson-01.json"),
        "utf8",
      ),
    ),
  );
  const lesson06 = lessonSchema.parse(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), "content/lessons/lesson-06.json"),
        "utf8",
      ),
    ),
  );
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
  const now = new Date().toISOString();
  writeProgress(lesson01.courseId, lesson01.id, {
    ...emptyProgress(lesson01),
    status: "completed",
    updatedAt: now,
    completedAt: now,
  });
  writeProgress(lesson06.courseId, lesson06.id, {
    ...emptyProgress(lesson06),
    status: "in_progress",
    updatedAt: new Date(Date.now() + 10).toISOString(),
  });
  const summary = readCourseProgressSummary(lesson01.courseId, 13);
  assert.equal(summary.completedLessons, 1);
  assert.equal(summary.currentLessonId, "lesson-06");
  assert.equal(summary.percent, 8);
  Reflect.deleteProperty(globalThis, "window");
});
