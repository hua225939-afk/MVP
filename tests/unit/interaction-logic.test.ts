import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateContainsTests,
  validateTextInput,
} from "../../lib/interaction-logic.ts";
import {
  interactionMetadata,
  registeredInteractionTypes,
} from "../../lib/interaction-types.ts";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import {
  evaluateTaskBuilder,
  getTaskBuilderDefaults,
} from "../../lib/task-builder-logic.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("自由表达按最小长度验证，不要求唯一答案", () => {
  assert.equal(
    validateTextInput("当用户点击按钮时，网页就会显示挑战成功", {
      mode: "minLength",
      minLength: 18,
    }),
    true,
  );
  assert.equal(
    validateTextInput("按钮变化", { mode: "minLength", minLength: 18 }),
    false,
  );
});

test("oneOf 验证按声明的规则规范化文本", () => {
  const validation = {
    mode: "oneOf" as const,
    acceptedAnswers: ["JavaScript"],
    normalize: [
      "trim" as const,
      "lowercase" as const,
      "removeWhitespace" as const,
      "removePunctuation" as const,
    ],
  };
  assert.equal(validateTextInput("  java script！", validation), true);
});

test("安全规则检查支持失败、修改和重新通过", () => {
  const tests = [
    { id: "click", label: "监听点击", includes: "click", message: "加入 click" },
    {
      id: "feedback",
      label: "成功反馈",
      includes: "挑战成功",
      message: "加入挑战成功",
    },
  ];
  const firstRun = evaluateContainsTests(
    "button.addEventListener('', () => {});",
    tests,
  );
  assert.deepEqual(firstRun.map((result) => result.passed), [false, false]);

  const secondRun = evaluateContainsTests(
    "button.addEventListener('click', () => { message.textContent = '挑战成功'; });",
    tests,
  );
  assert.deepEqual(secondRun.map((result) => result.passed), [true, true]);
});

test("每个已注册互动类型都有统一元数据", () => {
  assert.deepEqual(
    Object.keys(interactionMetadata).sort(),
    [...registeredInteractionTypes].sort(),
  );
});

function readLesson(path: string) {
  return lessonSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")),
  );
}

test("网页创造台的七项调整生成实时 HTML，页面适配可由失败变为通过", () => {
  const lesson = readLesson("content/lessons/lesson-01.json");
  const builder = lesson.steps
    .flatMap((step) => step.atoms)
    .find(
      (atom) =>
        atom.type === "taskBuilder" && atom.id === "lesson-01.make.builder",
    );
  assert.ok(builder?.type === "taskBuilder");
  const defaults = getTaskBuilderDefaults(builder);
  const changed = {
    ...defaults,
    direction: "学习提醒",
    "app-name": "专注起航站",
    "page-title": "今晚完成复习",
    "theme-color": "#2563EB",
    "card-style": "outline",
    "button-text": "完成打卡",
    "prompt-text": "完成后记录今天的进步",
  };
  const firstResult = evaluateTaskBuilder(builder, changed);
  assert.equal(firstResult.ready, true);
  assert.equal(firstResult.generatedCode.includes("<h1>今晚完成复习</h1>"), true);
  assert.equal(firstResult.generatedCode.includes('name="viewport"'), false);

  const responsiveResult = evaluateTaskBuilder(builder, {
    ...changed,
    adaptation: "responsive",
  });
  assert.equal(responsiveResult.generatedCode.includes('name="viewport"'), true);
});

test("第6课迁入统一 EventBuilder，不再保留重复 taskBuilder", () => {
  const lesson = readLesson("content/lessons/lesson-06.json");
  const atoms = lesson.steps.flatMap((step) => step.atoms);
  assert.equal(atoms.some((atom) => atom.type === "taskBuilder"), false);
  assert.equal(
    atoms.some((atom) => atom.type === "courseTool" && atom.toolId === "click-event"),
    true,
  );
  const scan = atoms.find((atom) => atom.type === "runTest");
  assert.ok(scan?.type === "runTest");
  assert.match(scan.initialCode ?? "", /count \+ 0/);
  assert.match(scan.initialCode ?? "", /setCount\(1\)/);
});
