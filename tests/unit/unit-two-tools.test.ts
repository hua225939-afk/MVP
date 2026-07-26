import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createDefaultProject, projectDocumentSchema } from "../../lib/projects/project-document.ts";
import { getCourseTool } from "../../lib/tools/course-tool-registry.ts";
import {
  contrastRatio,
  demoComponentSpec,
  demoStructureDraft,
  demoStyleTokens,
  isSafeComponentType,
  safeHtmlToStructure,
  scanStructure,
  structureToHtml,
  styleTokensToCss,
} from "../../lib/unit-two/creative-tools.ts";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("网页透视点击区域与 HTML 标签使用同一选中索引", () => {
  const source = read("components/workbench/tools/PageStructureStudio.tsx");
  assert.match(source, /setSelectedXray\(index\)/);
  assert.match(source, /currentCase\.nodes\[selectedXray\]\[0\]/);
  assert.match(source, /normal[\s\S]*outline[\s\S]*tags/);
  assert.match(source, /先猜它的作用/);
});

test("页面草图保存区域、箭头、便签、页面和第一单元素材入口", () => {
  const source = read("components/workbench/tools/PageStructureStudio.tsx");
  for (const label of ["顺序箭头", "文字便签", "保存页面草图", "导入第1课画板素材"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /lesson-03\.layout-sketch/);
});

test("AI 结构草稿读取第2课 coreFlow 并生成页面与语义区域", () => {
  const project = createDefaultProject();
  project.scope.coreFlow = ["填写目标", "开始记录", "查看结果"];
  const draft = demoStructureDraft(project);
  assert.equal(draft.pages.length, 3);
  assert.ok(draft.structure.some((node) => node.htmlTag === "header"));
  assert.ok(draft.structure.some((node) => node.htmlTag === "main"));
  assert.ok(draft.structure.some((node) => node.htmlTag === "footer"));
});

test("学生修改安全 HTML 后会反向生成结构并再次生成 HTML", () => {
  const project = createDefaultProject();
  project.structure = safeHtmlToStructure(
    "<header>我的应用</header><main><section><h1>开始</h1><button>继续</button></section></main>",
    "page-home",
  );
  const html = structureToHtml(project);
  assert.match(html, /<header>/);
  assert.match(html, /<main>/);
  assert.match(html, /<button>/);
});

test("HTML 层级验证定位无效父级、空内容与缺少 main", () => {
  const project = createDefaultProject();
  project.structure = [{
    id: "bad",
    pageId: "page-home",
    parentId: "missing",
    type: "text",
    htmlTag: "p",
    order: 0,
    content: "",
  }];
  const checks = scanStructure(project);
  assert.equal(checks.find((item) => item.id === "valid-parent")?.passed, false);
  assert.equal(checks.find((item) => item.id === "non-empty")?.passed, false);
  assert.equal(checks.find((item) => item.id === "semantic-root")?.passed, false);
});

test("情绪板选择图片后优先使用提取候选色生成 StyleTokens", () => {
  const project = createDefaultProject();
  project.moodboard.items = [{
    id: "reference",
    source: "local",
    title: "参考图",
    imageData: "/unit-two/neon-court.svg",
    colors: ["#112233", "#445566", "#F8FAFC"],
    favorite: true,
    selected: true,
  }];
  project.moodboard.fontMood = "清楚理性";
  const tokens = demoStyleTokens(project);
  assert.equal(tokens.primary, "#112233");
  assert.equal(tokens.secondary, "#445566");
  assert.equal(tokens.fontFamily, "清楚理性");
});

test("学生上传参考图通过 Canvas 像素采样提取候选色", () => {
  const source = read("components/workbench/tools/MoodboardThemeStudio.tsx");
  assert.match(source, /getImageData/);
  assert.match(source, /extractImageColors/);
  assert.match(source, /colors = await extractImageColors/);
});

test("StyleTokens 与 CSS 变量实时映射", () => {
  const project = createDefaultProject();
  project.styleTokens.primary = "#123456";
  project.styleTokens.spacing = "20px";
  const css = styleTokensToCss(project.styleTokens);
  assert.match(css, /--color-primary: #123456/);
  assert.match(css, /--space: 20px/);
  assert.ok(contrastRatio("#172033", "#F8FAFC") >= 4.5);
});

test("StyleTokens 必须逐项确认后才能保存学生修订", () => {
  const source = read("components/workbench/tools/MoodboardThemeStudio.tsx");
  assert.match(source, /tokenConfirmations/);
  assert.match(source, /confirmedTokens\.length !== tokenConfirmations\.length/);
  assert.match(source, /保存已逐项确认的 StyleTokens/);
});

test("组件馆十一类组件都有可操作演示与说明", () => {
  const source = read("components/workbench/tools/ComponentStudio.tsx");
  for (const token of ["info-card", "image-card", "button", "input", "option", "list", "progress", "alert", "result-card", "navigation", "modal"]) {
    assert.match(source, new RegExp(`(?:\"${token}\"|${token}:)`));
  }
  for (const label of ["解决什么问题", "可以修改", "适合哪些 App"]) {
    assert.match(source, new RegExp(label));
  }
});

test("自定义组件规格只输出安全基础组件组合", () => {
  const spec = demoComponentSpec("心情记录器", "记录输入并显示结果", [
    { kind: "input", label: "心情输入" },
    { kind: "button", label: "记录" },
    { kind: "result", label: "今日结果" },
  ]);
  assert.deepEqual(spec.safeComposition, ["input", "button", "result-card"]);
  assert.ok(spec.safeComposition.every(isSafeComponentType));
});

test("自定义组件画板支持鼠标与触控指针绘制和撤销", () => {
  const source = read("components/workbench/tools/ComponentStudio.tsx");
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /撤销一笔/);
});

test("安全预览拒绝未知组件类型且不包含任意代码执行", () => {
  assert.equal(isSafeComponentType("script"), false);
  assert.equal(isSafeComponentType("button"), true);
  const source = read("components/workbench/tools/ComponentStudio.tsx");
  assert.match(source, /data-safe-preview="controlled-react"/);
  assert.doesNotMatch(source, /\beval\s*\(|new Function/);
});

test("平板操作提供区域选择与上下移动且有响应式布局", () => {
  const pageSource = read("components/workbench/tools/PageStructureStudio.tsx");
  const componentSource = read("components/workbench/tools/ComponentStudio.tsx");
  const css = read("app/globals.css");
  assert.match(pageSource, /上移/);
  assert.match(componentSource, /上移/);
  assert.match(componentSource, /放入页面/);
  assert.match(css, /@media \(max-width:980px\)/);
});

test("第3—5课工具注册明确跨课输入、连续输出与 AI 修订字段", () => {
  const structure = getCourseTool("page-structure");
  const theme = getCourseTool("appearance-theme");
  const components = getCourseTool("component-center");
  assert.ok(structure && theme && components);
  assert.ok(structure.inputFields.includes("finalIntent"));
  assert.ok(structure.inputFields.includes("scope"));
  assert.ok(theme.inputFields.includes("structure"));
  assert.ok(theme.outputFields.includes("moodboard"));
  assert.ok(theme.outputFields.includes("styleTokens"));
  assert.ok(components.inputFields.includes("styleTokens"));
  assert.ok(components.outputFields.includes("customComponentBriefs"));
  assert.ok([structure, theme, components].every((tool) =>
    tool.outputFields.includes("aiDrafts") && tool.outputFields.includes("studentRevisions")
  ));
});

test("第二单元新增字段仍通过严格 ProjectDocument Schema", () => {
  const project = createDefaultProject();
  project.aiDrafts.push({
    id: "ai-structure-test",
    lessonId: "lesson-03",
    kind: "structure",
    payload: "{}",
    generatedAt: "2026-07-26T00:00:00.000Z",
    disclaimer: "本地规则",
  });
  project.studentRevisions.push({
    id: "revision-test",
    draftId: "ai-structure-test",
    lessonId: "lesson-03",
    kind: "structure",
    payload: "{}",
    reason: "学生修改",
    confirmedAt: "2026-07-26T00:01:00.000Z",
  });
  assert.equal(projectDocumentSchema.safeParse(project).success, true);
});
