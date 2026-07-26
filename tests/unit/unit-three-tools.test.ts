import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import {
  createDefaultProject,
  projectDocumentSchema,
} from "../../lib/projects/project-document.ts";
import {
  ProjectRepository,
  type ProjectStorage,
} from "../../lib/projects/project-repository.ts";
import { getCourseTool } from "../../lib/tools/course-tool-registry.ts";
import {
  evaluateProjectConditions,
  findConditionProblems,
  resetClickInteraction,
  runClickInteraction,
  updateStateValue,
  validateProjectInput,
} from "../../lib/unit-three/interaction-engine.ts";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

test("第6—9课分别接入唯一统一创造工具", () => {
  const expected = ["click-event", "input-output", "condition-branch", "state-memory"];
  expected.forEach((toolId, index) => {
    const lesson = lessonSchema.parse(
      JSON.parse(read(`content/lessons/lesson-${String(index + 6).padStart(2, "0")}.json`)),
    );
    const atoms = lesson.steps.flatMap((step) => step.atoms);
    assert.ok(atoms.some((atom) => atom.type === "courseTool" && atom.toolId === toolId));
    assert.ok(atoms.some((atom) => atom.type === "textInput"));
    assert.ok(atoms.some((atom) => atom.type === "runTest"));
  });
});

test("EventBuilder 支持第一次点击、连续点击和重置", () => {
  const interaction = {
    id: "event",
    componentId: "button",
    trigger: "click" as const,
    action: "message" as const,
    config: {
      effects: "message,color,counter",
      feedback: "记录成功",
      color: "#2563EB",
      increment: 1,
      resetValue: 0,
    },
  };
  const initial = resetClickInteraction(interaction, "#7C3AED");
  const first = runClickInteraction(interaction, initial);
  const second = runClickInteraction(interaction, first);
  assert.equal(first.message, "记录成功");
  assert.equal(first.accent, "#2563EB");
  assert.equal(first.count, 1);
  assert.equal(second.count, 2);
  assert.equal(resetClickInteraction(interaction, "#7C3AED").count, 0);
});

test("InputOutputBuilder 区分正常、空和超范围输入", () => {
  const input = {
    id: "input",
    componentId: "component-input",
    name: "score",
    value: "",
    inputType: "number" as const,
    required: true,
    min: 0,
    max: 100,
    errorMessage: "请输入0到100",
    resultTemplate: "结果：{{value}}",
  };
  assert.deepEqual(validateProjectInput(input, "25").kind, "normal");
  assert.deepEqual(validateProjectInput(input, "").kind, "empty");
  assert.deepEqual(validateProjectInput(input, "101").kind, "abnormal");
  assert.equal(validateProjectInput(input, "25").result, "结果：25");
});

test("ConditionBuilder 计算边界并扫描重复或遗漏", () => {
  const conditions = [
    { id: "low", inputId: "input", expression: "value < 50", operator: "lt" as const, compareValue: 50, order: 0, whenTrue: "低路线", whenFalse: "继续" },
    { id: "high", inputId: "input", expression: "value >= 50", operator: "gte" as const, compareValue: 50, order: 1, whenTrue: "高路线", whenFalse: "兜底" },
  ];
  assert.equal(evaluateProjectConditions(conditions, "49"), "低路线");
  assert.equal(evaluateProjectConditions(conditions, "50"), "高路线");
  assert.deepEqual(findConditionProblems(conditions), []);
  assert.match(findConditionProblems([...conditions, { ...conditions[1], id: "duplicate" }])[0], /重复条件/);
});

test("StateBuilder 状态可更新和清空，Schema 拒绝未知状态类型", () => {
  const state = {
    id: "memory",
    key: "count",
    value: 1,
    persistence: "local" as const,
    kind: "counter" as const,
    label: "完成次数",
  };
  assert.equal(updateStateValue(state, "increase").value, 2);
  assert.equal(updateStateValue(state, "clear").value, 0);
  const project = createDefaultProject();
  project.state = [state];
  assert.equal(projectDocumentSchema.safeParse(project).success, true);
  const invalid = structuredClone(project) as unknown as { state: Array<Record<string, unknown>> };
  invalid.state[0].kind = "global-secret";
  assert.equal(projectDocumentSchema.safeParse(invalid).success, false);
});

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("状态刷新恢复按 projectId 隔离，切换项目不能读取其他状态", () => {
  const repository = new ProjectRepository(
    new MemoryStorage(),
    () => "2026-07-26T00:00:00.000Z",
  );
  const first = repository.create("project-one", "项目一");
  const second = repository.create("project-two", "项目二");
  repository.save({
    ...first,
    state: [{ id: "memory", key: "favorite", value: true, persistence: "local", kind: "favorite", label: "收藏" }],
  });
  repository.save({
    ...second,
    state: [{ id: "memory", key: "favorite", value: false, persistence: "local", kind: "favorite", label: "收藏" }],
  });
  assert.equal(repository.get("project-one")?.state[0].value, true);
  assert.equal(repository.get("project-two")?.state[0].value, false);
});

test("第5—9课注册字段形成连续数据链", () => {
  const component = getCourseTool("component-center");
  const event = getCourseTool("click-event");
  const input = getCourseTool("input-output");
  const condition = getCourseTool("condition-branch");
  const state = getCourseTool("state-memory");
  assert.ok(component && event && input && condition && state);
  assert.ok(event.inputFields.includes("components"));
  assert.ok(input.inputFields.includes("interactions"));
  assert.ok(condition.inputFields.includes("inputs"));
  assert.ok(state.inputFields.includes("conditions"));
  assert.ok(event.outputFields.includes("decisions"));
  assert.ok(input.outputFields.includes("artifacts"));
  assert.ok(condition.outputFields.includes("artifacts"));
  assert.ok(state.outputFields.includes("artifacts"));
});

test("四工具和最终预览只使用受控渲染，并提供平板顺序操作布局", () => {
  const tools = read("components/workbench/tools/UnitThreeTools.tsx");
  const preview = read("components/workbench/ControlledProjectPreview.tsx");
  const workbench = read("components/workbench/WorkbenchShell.tsx");
  const css = read("app/globals.css");
  assert.doesNotMatch(`${tools}\n${preview}`, /\beval\s*\(|new Function/);
  assert.match(preview, /PREVIEW_RENDERER_MODE/);
  assert.match(preview, /data-project-id/);
  assert.match(tools, /试运行状态（尚未保存）/);
  assert.match(workbench, /recordedWithThisChange/);
  assert.match(workbench, /project\.tests\.filter\(\(item\) => !checkIds\.has\(item\.id\)\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.unit-three-builder/);
});
