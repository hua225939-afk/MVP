import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { courseSchema, lessonSchema } from "../../lib/lesson-schema.ts";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

const rawCourse = readJson(
  "content/courses/vibe-coding-foundations.json",
);
const rawLesson01 = readJson("content/lessons/lesson-01.json");
const rawLessons = Array.from({ length: 13 }, (_, index) =>
  readJson(
    `content/lessons/lesson-${String(index + 1).padStart(2, "0")}.json`,
  ),
);

test("正式课程与第1—13课 JSON 全部加载并通过 Schema", () => {
  assert.equal(courseSchema.parse(rawCourse).totalLessons, 13);
  const parsed = rawLessons.map((lesson) => lessonSchema.parse(lesson));
  assert.deepEqual(
    parsed.map((lesson) => lesson.id),
    Array.from(
      { length: 13 },
      (_, index) => `lesson-${String(index + 1).padStart(2, "0")}`,
    ),
  );
  assert.deepEqual(
    parsed.map((lesson) => lesson.order),
    Array.from({ length: 13 }, (_, index) => index + 1),
  );
  parsed.forEach((lesson) => {
    assert.deepEqual(
      lesson.steps.map((step) => step.phase),
      ["看", "讲", "想", "做", "测", "说"],
    );
  });
});

test("六步顺序错误会被拒绝并定位到 phase", () => {
  const lesson = structuredClone(rawLesson01) as {
    steps: Array<{ phase: string }>;
  };
  lesson.steps[0].phase = "讲";
  const result = lessonSchema.safeParse(lesson);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path.join(".") === "steps.0.phase",
      ),
    );
  }
});

test("Choice 的正确答案必须引用现有选项", () => {
  const lesson = structuredClone(rawLesson01) as {
    steps: Array<{
      atoms: Array<{ type: string; correctOptionId?: string }>;
    }>;
  };
  const choice = lesson.steps
    .flatMap((step) => step.atoms)
    .find((atom) => atom.type === "choice");
  assert.ok(choice);
  choice.correctOptionId = "missing-option";
  assert.equal(lessonSchema.safeParse(lesson).success, false);
});

test("完成规则不能引用非必做或不存在的原子", () => {
  const lesson = structuredClone(rawLesson01) as {
    steps: Array<{
      completion: { requiredAtomIds: string[] };
    }>;
  };
  lesson.steps[0].completion.requiredAtomIds = ["lesson-01.look.missing"];
  assert.equal(lessonSchema.safeParse(lesson).success, false);
});
