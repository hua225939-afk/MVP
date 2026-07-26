import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  DemoAIService,
  LiveAIService,
  withRetry,
} from "../../lib/ai/creative-ai-service.ts";
import { createDefaultProject, projectDocumentSchema } from "../../lib/projects/project-document.ts";
import { ProjectRepository, type ProjectStorage } from "../../lib/projects/project-repository.ts";
import {
  LIFE_SCENES,
  compressImage,
  galaxyIsTooLarge,
  hasStudentEditedIntent,
  sceneIllustration,
  unitOneChecks,
} from "../../lib/unit-one/creative-tools.ts";

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const demoInput = {
  interestMap: { nodes: [], links: [] },
  inspirationSources: [],
  keywords: ["记录", "清楚"],
  notes: ["谁", "问题"],
  sketchImage: null,
  studentNote: "帮助同学整理任务",
};

test("生活场景覆盖六类、本地 SVG 与问题热点", () => {
  assert.deepEqual(new Set(LIFE_SCENES.map((item) => item.category)).size, 6);
  LIFE_SCENES.forEach((scene) => {
    assert.ok(scene.hotspots.length >= 2);
    assert.match(sceneIllustration(scene), /^data:image\/svg\+xml/);
  });
});

test("兴趣节点可添加、删除并用两个或三个节点关联", () => {
  const project = createDefaultProject();
  project.interestMap.nodes = [
    { id: "a", category: "learning", label: "喜欢记录", detail: "", imageData: "", sourceId: null, role: "like", color: "#000", icon: "♥" },
    { id: "b", category: "campus", label: "消息遗漏", detail: "", imageData: "", sourceId: null, role: "problem", color: "#000", icon: "!" },
  ];
  project.interestMap.links.push({ id: "a-b", nodeIds: ["a", "b"], statement: "喜欢记录 → 解决遗漏" });
  assert.equal(projectDocumentSchema.safeParse(project).success, true);
  project.interestMap.nodes = project.interestMap.nodes.filter((item) => item.id !== "a");
  project.interestMap.links = project.interestMap.links.filter((item) => !item.nodeIds.includes("a"));
  assert.equal(project.interestMap.nodes.length, 1);
  assert.equal(project.interestMap.links.length, 0);
});

test("画板支持鼠标与触控指针、撤销重做、恢复和 JPEG 压缩", () => {
  const source = readFileSync(resolve(process.cwd(), "components/workbench/tools/IdeaCanvas.tsx"), "utf8");
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /撤销/);
  assert.match(source, /重做/);
  assert.match(source, /toDataURL\("image\/jpeg"/);
  assert.equal(compressImage(`data:image/jpeg;base64,${"a".repeat(200)}`, 80).length, 80);
});

test("Demo AI 明确标识本地规则且不声称理解图像", async () => {
  const result = await new DemoAIService().understand(demoInput);
  assert.equal(result.mode, "demo");
  assert.equal(result.provenance.provider, "local-rules");
  assert.match(result.provenance.disclaimer, /没有理解画板图像/);
  assert.ok(result.output.appIntent);
});

test("Live AI 成功、失败和统一重试", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new Error("temporary");
    return new Response(JSON.stringify({
      mode: "live",
      output: {
        appIntent: "测试意图", audience: "同学", scenario: "校园", problem: "遗漏",
        coreFunctions: ["记录"], possibleInputs: ["文字"], possibleOutputs: ["结果"],
        visualStyle: "清楚", uncertainties: [],
      },
      provenance: { provider: "openai", model: "configured", generatedAt: new Date().toISOString(), disclaimer: "live" },
    }));
  };
  try {
    const result = await withRetry(() => new LiveAIService().understand(demoInput), 1);
    assert.equal(result.mode, "live");
    assert.equal(calls, 2);
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "failed" }), { status: 502 });
    await assert.rejects(() => new LiveAIService().understand(demoInput), /failed/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AI 原稿、学生修改稿和 finalIntent 分层传递", () => {
  const project = createDefaultProject();
  const draft = {
    appIntent: "原稿", audience: "同学", scenario: "校园", problem: "遗漏",
    coreFunctions: ["记录"], possibleInputs: ["文字"], possibleOutputs: ["结果"],
    visualStyle: "清楚", uncertainties: [],
  };
  project.aiDraft = draft;
  project.studentRevision = { ...draft, problem: "常常遗漏社团通知" };
  project.finalIntent = project.studentRevision;
  assert.equal(hasStudentEditedIntent(project.aiDraft, project.studentRevision), true);
  assert.equal(project.finalIntent.problem, "常常遗漏社团通知");
});

test("功能星系范围提示、三格故事板产物和测试状态可保存", () => {
  const project = createDefaultProject();
  project.scope.mustHave = ["一", "二", "三", "四"];
  assert.equal(galaxyIsTooLarge(project), true);
  project.scope.mustHave = ["记录"];
  project.artifacts.push({
    id: "lesson-02.storyboard",
    type: "document",
    name: "三格用户故事板",
    content: JSON.stringify([{ id: "problem" }, { id: "use" }, { id: "result" }]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  assert.equal(JSON.parse(project.artifacts[0].content).length, 3);
});

test("第一单元字段刷新恢复且多项目隔离", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage);
  const first = repository.create("unit-one-a", "A");
  repository.create("unit-one-b", "B");
  repository.applyPatch(first.projectId, {
    projectId: first.projectId,
    baseRevision: first.revision,
    source: "lesson",
    lessonId: "lesson-01",
    toolId: "intent-canvas",
    allowedFields: ["keywords", "sketch"],
    changes: { keywords: ["校园"], sketch: { compressedImage: "data:image/jpeg;base64,a", elements: [], updatedAt: new Date().toISOString() } },
    createdAt: new Date().toISOString(),
  });
  const refreshed = new ProjectRepository(storage);
  assert.deepEqual(refreshed.get("unit-one-a")?.keywords, ["校园"]);
  assert.deepEqual(refreshed.get("unit-one-b")?.keywords, []);
  assert.equal(unitOneChecks(refreshed.get("unit-one-a")!).sketchSaved, true);
});
