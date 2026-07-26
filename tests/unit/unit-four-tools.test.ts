import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import {
  createDefaultProject,
  createProjectSnapshot,
  projectDocumentSchema,
  restoreProjectSnapshot,
} from "../../lib/projects/project-document.ts";
import {
  ProjectRepository,
  type ProjectStorage,
} from "../../lib/projects/project-repository.ts";
import { getCourseTool } from "../../lib/tools/course-tool-registry.ts";
import {
  clusterPeerReviews,
  compareVersions,
  composeInitialFlow,
  createDemoDebugDraft,
  createExperienceChecks,
  generateReproductionSteps,
  moveFlowNode,
  validateAppFlow,
} from "../../lib/unit-four/app-workflow.ts";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

function assembledProject() {
  const project = createDefaultProject("unit-four", "2026-07-26T00:00:00.000Z", "校园任务站");
  project.audience.primary = "第一次使用的学生";
  project.intent.statement = "帮助学生快速完成校园任务";
  project.pages = [
    { id: "home", name: "首页", slug: "home", order: 0, structureRootIds: [] },
    { id: "form", name: "填写页", slug: "form", order: 1, structureRootIds: [] },
    { id: "result", name: "结果页", slug: "result", order: 2, structureRootIds: [] },
  ];
  project.components = [
    { id: "start", pageId: "home", type: "button", name: "开始按钮", props: {} },
    { id: "submit", pageId: "form", type: "button", name: "提交按钮", props: {} },
  ];
  project.interactions = [
    { id: "click", componentId: "start", trigger: "click", action: "message", config: { feedback: "开始" } },
  ];
  project.inputs = [
    { id: "input", componentId: "submit", name: "任务", value: "", inputType: "text", label: "任务" },
  ];
  return project;
}

test("第10—12课分别接入流程、Bug与试玩工作室", () => {
  const expected = ["app-composer", "bug-scanner", "playtest-feedback"];
  expected.forEach((toolId, index) => {
    const lesson = lessonSchema.parse(
      JSON.parse(read(`content/lessons/lesson-${index + 10}.json`)),
    );
    const atoms = lesson.steps.flatMap((step) => step.atoms);
    assert.ok(atoms.some((atom) => atom.type === "courseTool" && atom.toolId === toolId));
    assert.ok(atoms.some((atom) => atom.type === "textInput"));
    assert.ok(atoms.some((atom) => atom.type === "runTest"));
  });
});

test("页面流程编排支持排序、起点核心入口结果页、返回和重启", () => {
  const project = assembledProject();
  const flow = composeInitialFlow(project);
  assert.deepEqual(flow.nodes.map((item) => item.pageId), ["home", "form", "result"]);
  assert.equal(flow.startPageId, "home");
  assert.equal(flow.coreEntryPageId, "home");
  assert.equal(flow.resultPageId, "result");
  assert.ok(flow.connections.some((item) => item.kind === "restart"));
  const moved = moveFlowNode(flow, "form", -1);
  assert.deepEqual(
    moved.nodes.filter((item) => item.enabled).sort((a, b) => a.order - b.order).map((item) => item.pageId),
    ["form", "home", "result"],
  );
  assert.deepEqual(validateAppFlow(flow), []);
});

test("流程扫描定位入口、断点、无返回和无用页面", () => {
  const flow = composeInitialFlow(assembledProject());
  flow.startPageId = null;
  flow.connections = [];
  assert.ok(validateAppFlow(flow).some((item) => item.includes("起点")));
  assert.ok(validateAppFlow(flow).some((item) => item.includes("下一页")));
  assert.ok(validateAppFlow(flow).some((item) => item.includes("返回")));
});

test("用户角色模拟保存可重复测试场景且应用预览保持受控", () => {
  const project = assembledProject();
  project.appFlow = composeInitialFlow(project);
  project.testScenarios.push({
    id: "voyage",
    name: "全流程试航",
    role: "第一次使用者",
    task: "完成任务并重新开始",
    pageIds: ["home", "form", "result"],
    steps: ["home→form", "form→result", "result→home"],
    status: "pass",
    runCount: 1,
    readOnly: true,
  });
  assert.equal(projectDocumentSchema.parse(project).testScenarios[0].readOnly, true);
  assert.doesNotMatch(read("components/workbench/ControlledProjectPreview.tsx"), /\beval\s*\(|new Function/);
});

test("AI体验检查读取意图、对象、流程、组件、互动与测试并等待学生逐项决定", () => {
  const project = assembledProject();
  project.appFlow = composeInitialFlow(project);
  const checks = createExperienceChecks(project);
  assert.deepEqual(checks.map((item) => item.id), ["entry", "input", "feedback", "return", "waste", "intent"]);
  assert.ok(checks.every((item) => item.studentResponse === null));
  assert.match(checks.find((item) => item.id === "intent")!.finding, /帮助学生/);
});

test("App 1.0字段包含封面说明、保留删除决定、测试与可恢复快照", () => {
  const project = assembledProject();
  project.appFlow = composeInitialFlow(project);
  const snapshot = createProjectSnapshot(project);
  const version = {
    id: "v1",
    label: "App 1.0",
    description: "保留核心入口，删除绕路功能",
    revision: project.revision,
    snapshot,
    createdAt: "2026-07-26T01:00:00.000Z",
    coverArtifactId: "cover",
    screenshotArtifactId: "shot",
    changes: ["保留核心入口", "删除绕路功能"],
    testSummary: "全流程通过",
    aiSuggestions: ["补返回"],
    studentDecisions: ["同意并修改"],
    peerFeedback: [],
  };
  project.versions = [version];
  assert.equal(projectDocumentSchema.parse(project).versions[0].label, "App 1.0");
  project.title = "修改后";
  assert.equal(restoreProjectSnapshot(project, snapshot, "2026-07-26T02:00:00.000Z").title, "校园任务站");
});

test("截图标注支持圈、箭头、文字和四类问题", () => {
  const project = assembledProject();
  const shapes = ["circle", "arrow", "text"] as const;
  project.bugAnnotations = shapes.map((shape, index) => ({
    id: `a-${shape}`,
    screenshotArtifactId: "shot",
    pageId: "home",
    shape,
    x: 10 + index,
    y: 20,
    width: 15,
    height: 10,
    text: "问题",
    problemType: (["visual", "interaction", "logic"] as const)[index],
  }));
  assert.equal(projectDocumentSchema.parse(project).bugAnnotations.length, 3);
  assert.match(read("components/workbench/tools/UnitFourTools.tsx"), /mark-\$\{item\.shape\}/);
});

test("Bug复现自动合并发生前后操作并关联日志与代码", () => {
  const steps = generateReproductionSteps(["进入首页"], "填写页", ["点击提交"]);
  assert.deepEqual(steps, ["打开 填写页", "进入首页", "执行被标注的操作", "点击提交", "对照预期结果与实际结果"]);
});

test("Demo AI调试草稿明确本地限制并至少给出两个可比较建议", () => {
  const report = {
    id: "bug-1",
    title: "提交后无反馈",
    type: "interaction" as const,
    severity: "high" as const,
    beforeActions: ["填写输入"],
    afterActions: ["点击提交"],
    reproSteps: ["打开填写页", "点击提交"],
    expected: "显示结果",
    actual: "无变化",
    annotationIds: ["a"],
    componentIds: ["submit"],
    codeExcerpt: "onClick",
    testLog: ["submit: fail"],
    status: "open" as const,
  };
  const draft = createDemoDebugDraft(report);
  assert.equal(draft.mode, "demo");
  assert.match(draft.disclaimer, /不理解截图/);
  assert.ok(draft.suggestions.length >= 2);
  assert.ok(draft.suggestions.every((item) => item.risk && item.retest));
});

test("真实AI调试接口读取截图标注复现代码日志且只返回候选草稿", () => {
  const route = read("app/api/debug-ai/route.ts");
  const service = read("lib/ai/debug-ai-service.ts");
  assert.match(route, /input_image/);
  assert.match(route, /relatedCode/);
  assert.match(route, /testLogs/);
  assert.match(route, /不要自动修改整个项目/);
  assert.match(service, /LiveDebugAIService/);
});

test("学生修复记录建议选择、修改方案、局部差异与复测判断", () => {
  const project = assembledProject();
  project.studentFixes = [{
    id: "fix",
    draftId: "draft",
    suggestionId: "suggestion-b",
    modifiedPlan: "只补反馈状态并保持返回路线",
    patchSummary: "局部修改提交组件",
    diff: "- no feedback\n+ aria-live feedback",
    beforeTestStatus: "fail",
    afterTestStatus: "pass",
    resolved: true,
  }];
  const parsed = projectDocumentSchema.parse(project).studentFixes[0];
  assert.equal(parsed.resolved, true);
  assert.match(parsed.diff, /^\-/);
});

test("修复版1.1保存建议、学生决定与复测摘要", () => {
  const project = assembledProject();
  const snapshot = createProjectSnapshot(project);
  project.versions.push({
    id: "v11", label: "修复版 1.1", description: "局部修复", revision: 1,
    snapshot, createdAt: "2026-07-26T01:00:00.000Z", coverArtifactId: null,
    screenshotArtifactId: "shot", changes: ["补反馈"], testSummary: "复测通过",
    aiSuggestions: ["三个候选"], studentDecisions: ["选择并修改第二个"], peerFeedback: [],
  });
  assert.equal(projectDocumentSchema.parse(project).versions[0].testSummary, "复测通过");
});

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("同伴只读Repository不能改正文，试玩反馈接口字段可独立保存", () => {
  const storage = new MemoryStorage();
  const writable = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z");
  writable.create("peer-project", "试玩项目");
  const readOnly = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z", "read-only");
  assert.throws(() => readOnly.save({ ...readOnly.ensure("peer-project"), title: "越权修改" }), /只读/);
  const project = writable.ensure("peer-project");
  project.peerReviews.push({
    id: "review", reviewer: "同伴", taskId: "task", pageId: "page-home",
    readOnly: true, screenshotArtifactId: null, annotationIds: [], note: "卡住",
    emotion: "confused", favorite: "颜色", stuckAt: "入口", suggestion: "突出按钮",
    severity: "high", problemType: "experience", cluster: "page-home:experience:high",
    aiSummary: "", studentSummary: "",
  });
  writable.save(project);
  assert.equal(writable.get("peer-project")?.peerReviews[0].readOnly, true);
});

test("情绪曲线严格记录开始操作结果三点", () => {
  const project = assembledProject();
  project.experienceCurves = [{
    id: "curve", reviewId: "review",
    points: [
      { phase: "start", emotion: 1, note: "期待" },
      { phase: "action", emotion: -2, note: "卡住" },
      { phase: "result", emotion: 2, note: "成功" },
    ],
  }];
  assert.deepEqual(projectDocumentSchema.parse(project).experienceCurves[0].points.map((item) => item.phase), ["start", "action", "result"]);
});

test("反馈按页面严重程度和问题类型聚类，AI草稿与学生总结分层", () => {
  const base = {
    reviewer: "同伴", taskId: "task", pageId: "home", readOnly: true as const,
    screenshotArtifactId: null, annotationIds: [], note: "入口不明显",
    emotion: "confused" as const, favorite: "", stuckAt: "入口", suggestion: "突出按钮",
    severity: "high" as const, problemType: "experience" as const,
    cluster: "home:experience:high", aiSummary: "本地草稿", studentSummary: "学生改为先调整对比度",
  };
  const clusters = clusterPeerReviews([{ ...base, id: "r1" }, { ...base, id: "r2" }]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].count, 2);
});

test("2.0版本对比展示新增修改、测试变化与同伴反馈", () => {
  const project = assembledProject();
  const snapshot = createProjectSnapshot(project);
  const v11 = {
    id: "v11", label: "修复版 1.1", description: "", revision: 1, snapshot,
    createdAt: "2026-07-26T01:00:00.000Z", coverArtifactId: null, screenshotArtifactId: null,
    changes: ["补反馈"], testSummary: "1项通过", aiSuggestions: [], studentDecisions: [], peerFeedback: [],
  };
  const v2 = {
    ...v11, id: "v2", label: "试玩升级版 2.0", revision: 2,
    changes: ["补反馈", "突出入口", "缩短步骤"], testSummary: "3项通过",
    peerFeedback: ["入口不明显"],
  };
  const diff = compareVersions(v11, v2);
  assert.deepEqual(diff.addedChanges, ["突出入口", "缩短步骤"]);
  assert.equal(diff.testChanged, true);
  assert.equal(diff.peerFeedbackAdded, 1);
});

test("第10—12课工具字段权限覆盖全部第四单元写入且不含publication", () => {
  const composer = getCourseTool("app-composer")!;
  const bug = getCourseTool("bug-scanner")!;
  const peer = getCourseTool("playtest-feedback")!;
  assert.ok(composer.outputFields.includes("appFlow"));
  assert.ok(composer.outputFields.includes("testScenarios"));
  assert.ok(bug.outputFields.includes("bugAnnotations"));
  assert.ok(bug.outputFields.includes("aiDebugDrafts"));
  assert.ok(bug.outputFields.includes("studentFixes"));
  assert.ok(peer.outputFields.includes("peerReviews"));
  assert.ok(peer.outputFields.includes("experienceCurves"));
  assert.ok(![...composer.outputFields, ...bug.outputFields, ...peer.outputFields].includes("publication"));
});

test("第四单元页面提供平板连接排序、截图标注、只读试玩和版本时间线", () => {
  const tools = read("components/workbench/tools/UnitFourTools.tsx");
  const workbench = read("components/workbench/WorkbenchShell.tsx");
  const css = read("app/globals.css");
  assert.match(tools, /点击后连接/);
  assert.match(tools, /上移/);
  assert.match(tools, /annotation-canvas/);
  assert.match(tools, /只读模式已开启/);
  assert.match(tools, /体验情绪曲线/);
  assert.match(workbench, /version-timeline/);
  assert.match(css, /@media \(max-width:900px\)/);
  assert.doesNotMatch(tools, /\beval\s*\(|new Function/);
});
