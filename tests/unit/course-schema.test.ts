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
const rawLesson03 = readJson("content/lessons/lesson-03.json");
const rawLesson04 = readJson("content/lessons/lesson-04.json");
const rawLesson05 = readJson("content/lessons/lesson-05.json");
const rawLesson06 = readJson("content/lessons/lesson-06.json");
const rawLesson07 = readJson("content/lessons/lesson-07.json");
const rawLesson08 = readJson("content/lessons/lesson-08.json");
const rawLesson09 = readJson("content/lessons/lesson-09.json");
const rawLesson10 = readJson("content/lessons/lesson-10.json");
const rawLesson11 = readJson("content/lessons/lesson-11.json");
const rawLesson12 = readJson("content/lessons/lesson-12.json");

test("正式课程与第3—12课 JSON 通过 Schema", () => {
  assert.equal(courseSchema.parse(rawCourse).totalLessons, 13);
  assert.equal(lessonSchema.parse(rawLesson01).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson03).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson04).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson05).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson06).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson07).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson08).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson09).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson10).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson11).steps.length, 6);
  assert.equal(lessonSchema.parse(rawLesson12).steps.length, 6);
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
