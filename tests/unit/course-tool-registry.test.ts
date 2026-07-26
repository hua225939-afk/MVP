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
