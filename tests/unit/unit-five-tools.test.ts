import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { lessonSchema } from "../../lib/lesson-schema.ts";
import {
  createDefaultProject,
  createProjectSnapshot,
  projectDocumentSchema,
} from "../../lib/projects/project-document.ts";
import { getCourseTool } from "../../lib/tools/course-tool-registry.ts";
import {
  createDemoScript,
  createPublicProject,
  createShareInfo,
  createStudentPresentation,
  demoDuration,
  generatePresentationDraft,
  getPublishedProjects,
  isValidPublicOrigin,
  moveStoryNode,
  readProjectStory,
  updateScreenshotCrop,
} from "../../lib/unit-five/publishing.ts";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const timestamp = "2026-07-26T08:00:00.000Z";

function intent(appIntent: string) {
  return {
    appIntent,
    audience: "校园同学",
    scenario: "课间",
    problem: "容易忘记任务",
    coreFunctions: ["记录", "提醒"],
    possibleInputs: ["任务"],
    possibleOutputs: ["清单"],
    visualStyle: "清楚明亮",
    uncertainties: [],
  };
}

function publishingProject() {
  const project = createDefaultProject("launch-project", timestamp, "校园任务星");
  project.audience.primary = "容易忘记任务的校园同学";
  project.scenario = { context: "课间整理任务", problem: "任务分散，容易遗漏" };
  project.intent = { statement: "帮助同学记录任务", expectedOutcome: "快速看到下一件要做的事" };
  project.interestMap.nodes = [{
    id: "interest-task",
    category: "campus",
    label: "课间任务",
    detail: "我想解决任务遗漏",
    imageData: "",
    sourceId: null,
    role: "problem",
    color: "#7C3AED",
    icon: "✓",
  }];
  project.aiDraft = intent("用网页整理校园任务");
  project.studentRevision = intent("让同学用一步记录下一件校园任务");
  project.finalIntent = project.studentRevision;
  project.sketch.compressedImage = "data:image/jpeg;base64,sketch";
  project.scope.mustHave = ["添加任务", "查看结果"];
  project.scope.coreFlow = ["输入任务", "提交", "看到结果"];
  project.pages.push({ id: "page-result", name: "结果页", slug: "result", order: 1, structureRootIds: [] });
  project.components.push({ id: "task-input", pageId: "page-home", type: "input", name: "任务输入", props: {} });
  project.interactions.push({ id: "task-click", componentId: "component-action", trigger: "click", action: "message", config: { feedback: "任务已保存" } });
  project.bugReports.push({
    id: "bug-feedback",
    title: "提交后没有反馈",
    type: "interaction",
    severity: "high",
    beforeActions: ["输入任务"],
    afterActions: ["点击提交"],
    reproSteps: ["输入", "提交"],
    expected: "显示保存结果",
    actual: "页面不变",
    annotationIds: [],
    componentIds: ["component-action"],
    codeExcerpt: "onClick",
    testLog: ["feedback: fail"],
    status: "resolved",
  });
  project.peerReviews.push({
    id: "peer-one",
    reviewer: "同伴小林",
    taskId: "task-one",
    pageId: "page-home",
    readOnly: true,
    screenshotArtifactId: null,
    annotationIds: [],
    note: "入口不明显",
    emotion: "confused",
    favorite: "结果很清楚",
    stuckAt: "开始按钮",
    suggestion: "提高按钮对比度",
    severity: "medium",
    problemType: "experience",
    cluster: "page-home:experience:medium",
    aiSummary: "入口需要加强",
    studentSummary: "我把主按钮对比度提高",
  });
  const snapshot = createProjectSnapshot(project);
  project.versions = [
    {
      id: "v1", label: "App 1.0", description: "核心流程完成", revision: 1,
      snapshot, createdAt: timestamp, coverArtifactId: null, screenshotArtifactId: null,
      changes: ["完成输入结果"], testSummary: "通过", aiSuggestions: [], studentDecisions: [], peerFeedback: [],
    },
    {
      id: "v11", label: "修复版 1.1", description: "补充操作反馈", revision: 2,
      snapshot, createdAt: timestamp, coverArtifactId: null, screenshotArtifactId: null,
      changes: ["修复反馈"], testSummary: "复测通过", aiSuggestions: ["检查事件"], studentDecisions: ["局部修改"], peerFeedback: [],
    },
    {
      id: "v2", label: "试玩升级版 2.0", description: "突出核心入口", revision: 3,
      snapshot, createdAt: timestamp, coverArtifactId: "cover", screenshotArtifactId: "shot",
      changes: ["提高对比度"], testSummary: "相同任务通过", aiSuggestions: [], studentDecisions: ["采纳并修改"], peerFeedback: ["入口不明显"],
    },
  ];
  project.artifacts = [
    { id: "cover", type: "cover", name: "产品封面", content: "data:image/svg+xml,cover", visibility: "public", createdAt: timestamp, updatedAt: timestamp },
    { id: "shot", type: "screenshot", name: "代表截图", content: "data:image/svg+xml,shot", visibility: "public", createdAt: timestamp, updatedAt: timestamp },
    { id: "private-photo", type: "screenshot", name: "私人图片", content: "PRIVATE_IMAGE_DATA", visibility: "private", createdAt: timestamp, updatedAt: timestamp },
  ];
  return project;
}

test("第13课路径接入唯一发布工具，并包含真实输入和发布测试", () => {
  const lesson = lessonSchema.parse(JSON.parse(read("content/lessons/lesson-13.json")));
  assert.equal(lesson.id, "lesson-13");
  assert.ok(lesson.steps.flatMap((step) => step.atoms).some((atom) => atom.type === "courseTool" && atom.toolId === "work-publisher"));
  assert.ok(lesson.steps.flatMap((step) => step.atoms).some((atom) => atom.type === "textInput"));
  assert.ok(lesson.steps.flatMap((step) => step.atoms).some((atom) => atom.type === "runTest"));
  assert.match(read("components/workbench/tools/ToolPanel.tsx"), /WorkPublisherTool/);
});

test("项目故事读取兴趣、双层意图、草图、视觉、组件、互动、Bug、同伴反馈和三个版本", () => {
  const story = readProjectStory(publishingProject(), timestamp);
  const sources = new Set(story.nodes.map((node) => node.source));
  for (const source of ["interest-map", "intent-draft", "student-intent", "page-sketch", "visual-theme", "component", "interaction", "bug", "peer-feedback", "version"]) {
    assert.equal(sources.has(source as never), true, `缺少故事来源 ${source}`);
  }
  assert.deepEqual(
    story.nodes.filter((node) => node.source === "version").map((node) => node.title),
    ["App 1.0", "修复版 1.1", "试玩升级版 2.0"],
  );
});

test("故事节点可删除公开选择并调整顺序", () => {
  const story = readProjectStory(publishingProject(), timestamp);
  story.nodes[1].selected = false;
  const moved = moveStoryNode(story, story.nodes[1].id, -1);
  assert.equal(moved.nodes[0].id, story.nodes[1].id);
  assert.equal(moved.nodes[0].selected, false);
  assert.deepEqual(moved.nodes.map((node) => node.order), moved.nodes.map((_, index) => index));
});

test("封面字段、自由版式和截图裁切通过Schema，裁切范围被限制", () => {
  const project = publishingProject();
  project.launchVisuals = {
    themeId: "custom",
    customThemeName: "任务信号",
    background: "#FFF3D6",
    textColor: "#39280A",
    layoutMode: "free",
    layoutId: "split",
    title: "校园任务星",
    icon: "✦",
    keywords: ["任务", "校园"],
    coverArtifactId: "cover",
    screenshots: [{ artifactId: "shot", order: 0, cropX: 50, cropY: 50, zoom: 1.4, caption: "核心操作" }],
    blocks: [
      { id: "feature", type: "feature", title: "核心功能", text: "一步记录", order: 0 },
      { id: "version", type: "version", title: "1.0 → 2.0", text: "入口更清楚", order: 1 },
    ],
    previewDevice: "tablet",
  };
  assert.equal(projectDocumentSchema.parse(project).launchVisuals.layoutMode, "free");
  const cropped = updateScreenshotCrop(project.launchVisuals.screenshots[0], { cropX: 140, cropY: -20, zoom: 5 });
  assert.deepEqual([cropped.cropX, cropped.cropY, cropped.zoom], [100, 0, 3]);
});

test("AI介绍原稿、学生修改稿和最终稿分层保存", () => {
  const project = publishingProject();
  project.projectStory = readProjectStory(project, timestamp);
  project.projectStory.nodes[0].markers = ["most-important", "ai-helped"];
  const draft = generatePresentationDraft(project, timestamp);
  const student = createStudentPresentation(draft);
  assert.equal(draft.sections.length, 8);
  assert.equal(student.sections[0].aiOriginal, draft.sections[0].content);
  student.sections = student.sections.map((section) => ({
    ...section,
    studentDraft: `${section.aiOriginal}（我重新组织后的表达）`,
    finalText: `${section.aiOriginal}（最终稿）`,
  }));
  student.finalizedAt = timestamp;
  project.presentationDraft = draft;
  project.studentPresentation = student;
  const parsed = projectDocumentSchema.parse(project);
  assert.notEqual(parsed.studentPresentation.sections[0].finalText, parsed.studentPresentation.sections[0].aiOriginal);
  assert.equal(parsed.presentationDraft.sourceRevision, project.revision);
});

test("一分钟演示包含七阶段并报告是否超时", () => {
  const project = publishingProject();
  project.projectStory = readProjectStory(project, timestamp);
  project.presentationDraft = generatePresentationDraft(project, timestamp);
  project.studentPresentation = createStudentPresentation(project.presentationDraft);
  const script = createDemoScript(project);
  assert.deepEqual(script.stages.map((stage) => stage.id), ["opening", "problem", "core-action", "result", "upgrade", "ai-student", "closing"]);
  assert.equal(demoDuration(script), 60);
  script.stages[0].seconds = 12;
  assert.equal(demoDuration(script) > 60, true);
});

function publishedProject() {
  const project = publishingProject();
  project.projectStory = readProjectStory(project, timestamp);
  project.projectStory.nodes[0].markers = ["most-important"];
  project.projectStory.nodes[0].screenshotArtifactId = "private-photo";
  project.launchVisuals = {
    ...project.launchVisuals,
    title: project.title,
    coverArtifactId: "cover",
    screenshots: [{ artifactId: "shot", order: 0, cropX: 50, cropY: 50, zoom: 1, caption: "代表页面" }],
  };
  project.presentationDraft = generatePresentationDraft(project, timestamp);
  project.studentPresentation = createStudentPresentation(project.presentationDraft);
  project.studentPresentation.sections = project.studentPresentation.sections.map((section) => ({
    ...section,
    studentDraft: `${section.aiOriginal} 学生修改`,
    finalText: `${section.aiOriginal} 学生最终稿`,
  }));
  project.studentPresentation.finalizedAt = timestamp;
  project.publication = {
    status: "published",
    versionId: "public-v",
    title: project.title,
    description: "核心功能",
    coverArtifactId: "cover",
    visibility: "public",
    safetyChecks: [],
    url: "https://works.example.com/showcase/launch-project",
    qrCodeArtifactId: null,
    publishedAt: timestamp,
    oneLine: "一步整理校园任务",
    audience: project.audience.primary,
    problem: project.scenario.problem,
    featureTags: ["任务", "提醒"],
    category: "校园",
    experienceInstructions: "输入任务并提交",
    featuredPageIds: ["page-home"],
    storyNodeIds: [project.projectStory.nodes[0].id],
    learningReflection: "我学会用测试和反馈升级作品。",
  };
  return project;
}

test("公开页面使用只读安全投影，隐藏私人图片、测试答案、教师数据和未选草稿", () => {
  const project = publishedProject();
  project.tests.push({
    id: "secret-answer",
    name: "测试答案",
    status: "pass",
    projectRevision: 1,
    toolId: "work-publisher",
    message: "SECRET_TEST_ANSWER",
    attempts: 1,
    updatedAt: timestamp,
  });
  project.presentationDraft.disclaimer = "PRIVATE_AI_DRAFT";
  const projection = createPublicProject(project);
  assert.ok(projection);
  const serialized = JSON.stringify(projection);
  assert.doesNotMatch(serialized, /PRIVATE_IMAGE_DATA|SECRET_TEST_ANSWER|PRIVATE_AI_DRAFT|student-an/);
  assert.equal("tests" in projection, false);
  assert.match(read("components/publication/PublicProjectPage.tsx"), /data-access="read-only"/);
  assert.doesNotMatch(read("components/publication/PublicProjectPage.tsx"), /ToolPanel|WorkbenchShell|PROJECT_EDITABLE_FIELDS/);
});

test("作品广场只筛选publication.status为published的项目", () => {
  const published = publishedProject();
  const draft = createDefaultProject("draft", timestamp, "未发布");
  const demo = createDefaultProject("demo", timestamp, "演示发布");
  demo.publication.status = "published_demo";
  assert.deepEqual(getPublishedProjects([draft, demo, published]).map((item) => item.projectId), ["launch-project"]);
  assert.equal(createPublicProject(draft), null);
});

test("分享链接区分本地演示和有效公开域名，localhost不生成二维码", () => {
  assert.equal(isValidPublicOrigin("http://localhost:3000"), false);
  assert.equal(isValidPublicOrigin("https://works.example.com"), true);
  const local = createShareInfo("http://localhost:3000", "launch-project");
  assert.match(local.url, /localhost:3000\/showcase\/launch-project/);
  assert.equal(local.qrImageUrl, null);
  const deployed = createShareInfo("https://works.example.com", "launch-project");
  assert.match(deployed.url, /^https:\/\/works\.example\.com\/showcase/);
  assert.match(deployed.qrImageUrl ?? "", /create-qr-code/);
});

test("发布工具字段权限覆盖九类写入且提供电脑和平板路径", () => {
  const tool = getCourseTool("work-publisher");
  assert.ok(tool);
  for (const field of ["projectStory", "launchVisuals", "presentationDraft", "studentPresentation", "demoScript", "publication", "finalVersion", "decisions", "artifacts", "tests"]) {
    assert.ok(tool.outputFields.includes(field as never), `发布工具缺少 ${field}`);
  }
  const css = read("app/globals.css");
  const studio = read("components/workbench/tools/UnitFiveTools.tsx");
  assert.match(css, /\.launch-live-preview\.desktop/);
  assert.match(css, /\.launch-live-preview\.tablet/);
  assert.match(studio, /stage=|searchParams\.set\("stage"/);
  assert.match(read("app/showcase/[projectId]/page.tsx"), /PublicProjectPage/);
  assert.match(read("app/gallery/page.tsx"), /PublicationGallery/);
});
