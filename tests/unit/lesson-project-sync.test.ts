import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import { emptyProgress } from "../../lib/progress-storage.ts";
import { DEFAULT_PROJECT_ID } from "../../lib/projects/project-document.ts";
import {
  mergeProjectIntoLessonProgress,
  syncLessonProgressToProject,
} from "../../lib/projects/lesson-project-sync.ts";
import { getBrowserProjectRepository } from "../../lib/projects/project-repository.ts";
import { parseTaskBuilderPayload } from "../../lib/task-builder-logic.ts";

function memoryWindow() {
  const values = new Map<string, string>();
  return {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    dispatchEvent: () => true,
  };
}

function readLesson(path: string) {
  return lessonSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")),
  );
}

test("第 1 课成果写入主 ProjectDocument，创造台修改可合并回课程", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: memoryWindow(),
  });
  const lesson = readLesson("content/lessons/lesson-01.json");
  const repository = getBrowserProjectRepository();
  repository?.createAndActivate("课程主项目", DEFAULT_PROJECT_ID);
  const now = new Date().toISOString();
  const progress = {
    ...emptyProgress(lesson),
    status: "in_progress" as const,
    interactions: {
      "lesson-01.make.builder": {
        value: JSON.stringify({
          schemaVersion: 1,
          fields: {
            direction: "学习提醒",
            "app-name": "专注起航站",
            "page-title": "今晚完成复习",
            "prompt-text": "记录今天的进步",
          },
          generatedCode: "<h1>今晚完成复习</h1>",
          changeCount: 7,
          savedAt: now,
        }),
        completed: true,
        correct: true,
        attempts: 1,
        updatedAt: now,
      },
    },
    updatedAt: now,
  };
  const synced = syncLessonProgressToProject(lesson.id, progress);
  assert.equal(synced?.projectId, DEFAULT_PROJECT_ID);
  assert.equal(synced?.title, "专注起航站");
  assert.equal(
    synced?.artifacts.some((item) => item.id === "lesson-01.generated-code"),
    true,
  );

  const changed = repository?.save({ ...synced!, title: "创造台里的新名称" });
  assert.ok(changed);
  const merged = mergeProjectIntoLessonProgress(lesson, progress);
  const payload = parseTaskBuilderPayload(
    merged.interactions["lesson-01.make.builder"].value,
  );
  assert.equal(payload?.fields["app-name"], "创造台里的新名称");
  Reflect.deleteProperty(globalThis, "window");
});

test("第 6 课点击事件继续修改同一个主项目", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: memoryWindow(),
  });
  const lesson = readLesson("content/lessons/lesson-06.json");
  const repository = getBrowserProjectRepository();
  repository?.createAndActivate("课程主项目", DEFAULT_PROJECT_ID);
  const now = new Date().toISOString();
  const progress = {
    ...emptyProgress(lesson),
    status: "in_progress" as const,
    interactions: {
      "lesson-06.make.builder": {
        value: JSON.stringify({
          schemaVersion: 1,
          fields: {
            "event-task": "喝水记录器",
            effects: ["message", "counter"],
            "feedback-text": "喝水记录成功",
            "event-color": "#2563EB",
            "start-value": "1",
          },
          generatedCode: "onClick={handleActivate}",
          changeCount: 5,
          savedAt: now,
        }),
        completed: true,
        correct: true,
        attempts: 1,
        updatedAt: now,
      },
    },
    updatedAt: now,
  };
  const synced = syncLessonProgressToProject(lesson.id, progress);
  assert.equal(synced?.projectId, DEFAULT_PROJECT_ID);
  assert.equal(synced?.interactions[0].trigger, "click");
  assert.equal(synced?.interactions[0].config.feedback, "喝水记录成功");
  assert.equal(synced?.interactions[0].config.startValue, 1);
  Reflect.deleteProperty(globalThis, "window");
});

test("第 1 课和第 6 课只修改 activeProjectId 指向的同一项目", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: memoryWindow(),
  });
  const repository = getBrowserProjectRepository()!;
  const historical = repository.create("historical", "历史项目");
  const active = repository.createAndActivate("当前课程项目", "active-course");
  const lesson01 = readLesson("content/lessons/lesson-01.json");
  const lesson06 = readLesson("content/lessons/lesson-06.json");
  const now = new Date().toISOString();
  const builder = (
    lessonId: string,
    fields: Record<string, string | string[]>,
  ) => ({
    value: JSON.stringify({
      schemaVersion: 1,
      fields,
      generatedCode: `<div>${lessonId}</div>`,
      changeCount: Object.keys(fields).length,
      savedAt: now,
    }),
    completed: true,
    correct: true,
    attempts: 1,
    updatedAt: now,
  });
  syncLessonProgressToProject(lesson01.id, {
    ...emptyProgress(lesson01),
    status: "in_progress",
    interactions: {
      "lesson-01.make.builder": builder("lesson-01", {
        "app-name": "同一个当前项目",
        direction: "生活工具",
        "page-title": "项目首页",
        "prompt-text": "完成任务",
      }),
    },
    updatedAt: now,
  });
  syncLessonProgressToProject(lesson06.id, {
    ...emptyProgress(lesson06),
    status: "in_progress",
    interactions: {
      "lesson-06.make.builder": builder("lesson-06", {
        "event-task": "记录任务",
        effects: ["message", "counter"],
        "feedback-text": "记录成功",
        "event-color": "#7C3AED",
        "start-value": "0",
      }),
    },
    updatedAt: new Date(Date.now() + 10).toISOString(),
  });
  const updatedActive = repository.get(active.projectId);
  assert.equal(updatedActive?.title, "同一个当前项目");
  assert.equal(updatedActive?.interactions[0].config.feedback, "记录成功");
  assert.deepEqual(repository.get(historical.projectId), historical);
  Reflect.deleteProperty(globalThis, "window");
});
