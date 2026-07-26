import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultProject } from "../../lib/projects/project-document.ts";
import {
  applyToolChanges,
  courseToolRegistry,
  getCourseTool,
  isCourseToolUnlocked,
} from "../../lib/tools/course-tool-registry.ts";

test("13 种创造工具使用唯一正式注册定义", () => {
  assert.equal(courseToolRegistry.length, 13);
  assert.equal(new Set(courseToolRegistry.map((item) => item.id)).size, 13);
  assert.deepEqual(
    courseToolRegistry.map((item) => item.lessonOrder),
    Array.from({ length: 13 }, (_, index) => index + 1),
  );
  assert.deepEqual(courseToolRegistry.map((item) => item.id), [
    "intent-canvas",
    "project-boundary",
    "page-structure",
    "appearance-theme",
    "component-center",
    "click-event",
    "input-output",
    "condition-branch",
    "state-memory",
    "app-composer",
    "bug-scanner",
    "playtest-feedback",
    "work-publisher",
  ]);
  courseToolRegistry.forEach((item) => {
    assert.ok(item.inputFields);
    assert.ok(item.outputFields.length > 0);
    assert.ok(item.basicMode.summary);
    assert.ok(item.freeMode.summary);
    assert.ok(item.testRules.length > 0);
    assert.ok(item.reactComponent);
  });
});

test("当前只解锁已提供正式课次的工具", () => {
  const context = {
    availableLessonIds: ["lesson-01", "lesson-06"],
    project: createDefaultProject(),
  };
  const unlocked = courseToolRegistry
    .filter((item) => isCourseToolUnlocked(item, context))
    .map((item) => item.id);
  assert.deepEqual(unlocked, ["intent-canvas", "click-event"]);
});

test("工具只能修改注册表声明的输出字段", () => {
  const project = createDefaultProject();
  const clickTool = getCourseTool("click-event");
  assert.ok(clickTool);
  assert.throws(() => applyToolChanges(project, clickTool, { title: "越权标题" }));
});

test("第2课项目边界只在同一项目存在 finalIntent 后解锁", () => {
  const project = createDefaultProject();
  const boundary = getCourseTool("project-boundary");
  assert.ok(boundary);
  assert.equal(isCourseToolUnlocked(boundary, {
    availableLessonIds: ["lesson-01", "lesson-02"],
    project,
  }), false);
  project.finalIntent = {
    appIntent: "帮助同学整理任务",
    audience: "同学",
    scenario: "学习",
    problem: "任务容易遗漏",
    coreFunctions: ["记录任务"],
    possibleInputs: ["任务"],
    possibleOutputs: ["清单"],
    visualStyle: "清楚",
    uncertainties: [],
  };
  assert.equal(isCourseToolUnlocked(boundary, {
    availableLessonIds: ["lesson-01", "lesson-02"],
    project,
  }), true);
});

test("第13课发布工具只在1.0、1.1和2.0版本齐全后解锁", () => {
  const project = createDefaultProject();
  const publisher = getCourseTool("work-publisher");
  assert.ok(publisher);
  const context = {
    availableLessonIds: Array.from(
      { length: 13 },
      (_, index) => `lesson-${String(index + 1).padStart(2, "0")}`,
    ),
    project,
  };
  const timestamp = "2026-07-26T00:00:00.000Z";
  const addVersion = (label: string) => {
    project.versions.push({
      id: `version-${project.versions.length + 1}`,
      label,
      description: "",
      revision: 0,
      snapshot: "{}",
      createdAt: timestamp,
      coverArtifactId: null,
      screenshotArtifactId: null,
      changes: [],
      testSummary: "",
      aiSuggestions: [],
      studentDecisions: [],
      peerFeedback: [],
    });
  };
  addVersion("随手快照 A");
  addVersion("随手快照 B");
  addVersion("随手快照 C");
  assert.equal(isCourseToolUnlocked(publisher, context), false);
  addVersion("App 1.0");
  addVersion("修复版 1.1");
  assert.equal(isCourseToolUnlocked(publisher, context), false);
  addVersion("试玩升级版 2.0");
  assert.equal(isCourseToolUnlocked(publisher, context), true);
});
