import type { ProjectDocument } from "../projects/project-document.ts";

export type ProjectStory = ProjectDocument["projectStory"];
export type StoryNode = ProjectStory["nodes"][number];
export type LaunchVisuals = ProjectDocument["launchVisuals"];

const sectionLabels = {
  "one-line": "一句话介绍",
  audience: "为谁设计",
  problem: "解决什么问题",
  features: "核心功能",
  experience: "怎样体验",
  upgrade: "最重要的升级",
  "ai-role": "AI参与",
  "student-decision": "学生个人决定",
} as const;

function clean(values: Array<string | undefined | null>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function storyNode(
  id: string,
  source: StoryNode["source"],
  title: string,
  summary: string,
  order: number,
): StoryNode {
  return {
    id,
    source,
    title,
    summary,
    selected: true,
    order,
    screenshotArtifactId: null,
    note: "",
    markers: [],
  };
}

export function readProjectStory(
  project: ProjectDocument,
  now = new Date().toISOString(),
): ProjectStory {
  const nodes: StoryNode[] = [];
  const add = (
    id: string,
    source: StoryNode["source"],
    title: string,
    summary: string,
  ) => nodes.push(storyNode(id, source, title, summary, nodes.length));

  project.interestMap.nodes.forEach((node) =>
    add(`story-interest-${node.id}`, "interest-map", `最初兴趣：${node.label}`, node.detail || node.role),
  );
  if (project.aiDraft) {
    add("story-intent-ai", "intent-draft", "AI整理的意图草稿", project.aiDraft.appIntent);
  }
  if (project.studentRevision) {
    add("story-intent-student", "student-intent", "我修改后的意图", project.studentRevision.appIntent);
  }
  if (project.sketch.compressedImage || project.sketch.elements.length > 0) {
    add("story-page-sketch", "page-sketch", "页面草图", `${project.sketch.elements.length} 个画布元素`);
  }
  const selectedTheme = project.styles.themes.find((item) => item.id === project.styles.selectedThemeId);
  add(
    "story-visual-theme",
    "visual-theme",
    "视觉主题",
    clean([selectedTheme?.name, ...project.moodboard.keywords]).join(" · ") || "自定义视觉主题",
  );
  project.components.forEach((component) =>
    add(`story-component-${component.id}`, "component", `组件：${component.name}`, component.type),
  );
  project.interactions.forEach((interaction) =>
    add(
      `story-interaction-${interaction.id}`,
      "interaction",
      `互动：${interaction.trigger} → ${interaction.action}`,
      String(interaction.config.feedback ?? interaction.config.message ?? "可操作反馈"),
    ),
  );
  project.bugReports.forEach((report) =>
    add(`story-bug-${report.id}`, "bug", `修复 Bug：${report.title}`, `${report.expected}；${report.status}`),
  );
  project.peerReviews.forEach((review) =>
    add(
      `story-peer-${review.id}`,
      "peer-feedback",
      `同伴反馈：${review.reviewer}`,
      review.studentSummary || review.suggestion || review.note,
    ),
  );
  project.versions
    .filter((version) => ["App 1.0", "修复版 1.1", "试玩升级版 2.0"].includes(version.label))
    .forEach((version) =>
      add(`story-version-${version.id}`, "version", version.label, clean([version.description, ...version.changes]).join("；")),
    );

  const previous = new Map(project.projectStory.nodes.map((node) => [node.id, node]));
  const merged = nodes.map((node) => {
    const saved = previous.get(node.id);
    return saved
      ? { ...node, ...saved, title: node.title, summary: node.summary }
      : node;
  });
  const custom = project.projectStory.nodes.filter(
    (node) => node.source === "student-note" && !merged.some((item) => item.id === node.id),
  );
  return {
    nodes: [...merged, ...custom]
      .sort((a, b) => a.order - b.order)
      .map((node, order) => ({ ...node, order })),
    updatedAt: now,
  };
}

export function moveStoryNode(
  story: ProjectStory,
  nodeId: string,
  direction: -1 | 1,
): ProjectStory {
  const index = story.nodes.findIndex((node) => node.id === nodeId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= story.nodes.length) return story;
  const nodes = [...story.nodes];
  [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
  return {
    ...story,
    nodes: nodes.map((node, order) => ({ ...node, order })),
  };
}

export function updateScreenshotCrop(
  screenshot: LaunchVisuals["screenshots"][number],
  crop: Partial<Pick<typeof screenshot, "cropX" | "cropY" | "zoom">>,
) {
  return {
    ...screenshot,
    cropX: Math.min(100, Math.max(0, crop.cropX ?? screenshot.cropX)),
    cropY: Math.min(100, Math.max(0, crop.cropY ?? screenshot.cropY)),
    zoom: Math.min(3, Math.max(1, crop.zoom ?? screenshot.zoom)),
  };
}

export function generatePresentationDraft(
  project: ProjectDocument,
  now = new Date().toISOString(),
): ProjectDocument["presentationDraft"] {
  const important = project.projectStory.nodes.find((node) =>
    node.markers.includes("most-important"),
  );
  const upgrade = [...project.versions]
    .reverse()
    .find((version) => version.label === "试玩升级版 2.0" || version.label === "修复版 1.1");
  const aiHelp = project.projectStory.nodes
    .filter((node) => node.markers.includes("ai-helped"))
    .map((node) => node.title);
  const decisions = project.decisions
    .filter((decision) => decision.suggestedBy === "student")
    .slice(-3)
    .map((decision) => decision.title);
  const features = clean([
    ...project.scope.mustHave,
    ...project.components.slice(0, 3).map((component) => component.name),
  ]);
  const oneLine = `${project.title}，帮助${project.audience.primary || "目标用户"}${project.intent.expectedOutcome || project.intent.statement || "更轻松地完成核心任务"}。`;
  const values = {
    "one-line": oneLine,
    audience: project.audience.primary || "还需要补充服务对象",
    problem: project.scenario.problem || project.intent.statement || "还需要补充用户问题",
    features: features.join("、") || "还需要选择核心功能",
    experience: `从${project.pages[0]?.name ?? "首页"}进入，完成${project.scope.coreFlow.join("，") || "核心操作"}，查看应用反馈。`,
    upgrade: upgrade
      ? `${upgrade.label}：${clean([upgrade.description, ...upgrade.changes]).join("；")}`
      : "还需要选择一次关键升级",
    "ai-role": aiHelp.length > 0 ? `AI帮助整理：${aiHelp.join("、")}` : "AI帮助整理意图与检查草稿，最终决定由学生完成。",
    "student-decision": clean([important?.title, ...decisions]).join("；") || "还需要补充学生自己的关键决定",
  } satisfies Record<keyof typeof sectionLabels, string>;
  const sections = (Object.keys(sectionLabels) as Array<keyof typeof sectionLabels>).map((id) => ({
    id,
    label: sectionLabels[id],
    content: values[id],
  }));
  return {
    generatedAt: now,
    sourceRevision: project.revision,
    disclaimer: "本地整理草稿只读取当前项目已保存内容，不会自动发布；学生必须逐项修改、删除和重新组织。",
    sections,
    minuteScript: [
      oneLine,
      `我观察到的问题是：${values.problem}`,
      `请看核心体验：${values.experience}`,
      `最重要的升级是：${values.upgrade}`,
      `${values["ai-role"]}；我自己的决定是：${values["student-decision"]}`,
    ].join("\n"),
  };
}

export function createStudentPresentation(
  draft: ProjectDocument["presentationDraft"],
): ProjectDocument["studentPresentation"] {
  return {
    sections: draft.sections.map((section, order) => ({
      ...section,
      aiOriginal: section.content,
      studentDraft: section.content,
      finalText: "",
      included: true,
      order,
    })),
    minuteScript: {
      aiOriginal: draft.minuteScript,
      studentDraft: draft.minuteScript,
      finalText: "",
    },
    finalizedAt: null,
  };
}

export function createDemoScript(
  project: ProjectDocument,
): ProjectDocument["demoScript"] {
  const finalById = new Map(
    project.studentPresentation.sections.map((section) => [section.id, section.finalText || section.studentDraft]),
  );
  const pageId = project.pages[0]?.id ?? null;
  const screenshotId = project.launchVisuals.screenshots[0]?.artifactId ?? null;
  const stages: Array<Omit<ProjectDocument["demoScript"]["stages"][number], "order">> = [
    { id: "opening", label: "开场", script: finalById.get("one-line") ?? "", seconds: 7, assetType: "screenshot", assetId: project.launchVisuals.coverArtifactId },
    { id: "problem", label: "用户问题", script: finalById.get("problem") ?? "", seconds: 8, assetType: "page", assetId: pageId },
    { id: "core-action", label: "核心操作", script: finalById.get("experience") ?? "", seconds: 14, assetType: "live", assetId: pageId },
    { id: "result", label: "结果", script: finalById.get("features") ?? "", seconds: 8, assetType: "page", assetId: project.pages.at(-1)?.id ?? pageId },
    { id: "upgrade", label: "一次关键升级", script: finalById.get("upgrade") ?? "", seconds: 9, assetType: "screenshot", assetId: screenshotId },
    { id: "ai-student", label: "AI与学生分工", script: `${finalById.get("ai-role") ?? ""} ${finalById.get("student-decision") ?? ""}`.trim(), seconds: 9, assetType: "screenshot", assetId: screenshotId },
    { id: "closing", label: "结束语", script: "欢迎进入只读体验，看看这个作品是否真的解决了问题。", seconds: 5, assetType: "live", assetId: pageId },
  ];
  return {
    stages: stages.map((stage, order) => ({ ...stage, order })),
    rehearsal: { durationSeconds: 0, overTime: false, testedAt: null },
  };
}

export function demoDuration(script: ProjectDocument["demoScript"]) {
  return script.stages.reduce((total, stage) => total + stage.seconds, 0);
}

export function isValidPublicOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return ["http:", "https:"].includes(url.protocol) &&
      !["localhost", "127.0.0.1", "::1"].includes(hostname) &&
      !hostname.endsWith(".local");
  } catch {
    return false;
  }
}

export function createShareInfo(origin: string, projectId: string) {
  const url = `${origin.replace(/\/$/, "")}/showcase/${encodeURIComponent(projectId)}`;
  return {
    url,
    isLocalDemo: !isValidPublicOrigin(origin),
    qrImageUrl: isValidPublicOrigin(origin)
      ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
      : null,
  };
}

export function getPublishedProjects(projects: ProjectDocument[]) {
  return projects.filter((project) => project.publication.status === "published");
}

export function createPublicProject(project: ProjectDocument) {
  if (project.publication.status !== "published") return null;
  const publicArtifacts = new Map(
    project.artifacts
      .filter((artifact) => artifact.visibility === "public")
      .map((artifact) => [artifact.id, artifact]),
  );
  const story = project.projectStory.nodes
    .filter((node) => project.publication.storyNodeIds.includes(node.id))
    .map((node) => ({
      id: node.id,
      title: node.title,
      summary: node.summary,
      note: node.note,
      markers: node.markers,
      screenshot: node.screenshotArtifactId
        ? publicArtifacts.get(node.screenshotArtifactId)?.content ?? null
        : null,
    }));
  const screenshots = project.launchVisuals.screenshots.flatMap((item) => {
    const artifact = publicArtifacts.get(item.artifactId);
    return artifact ? [{ ...item, content: artifact.content }] : [];
  });
  const presentation = [...project.studentPresentation.sections]
    .filter((section) => section.included && (section.finalText || section.studentDraft).trim())
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      label: section.label,
      text: section.finalText || section.studentDraft,
    }));
  return {
    projectId: project.projectId,
    title: project.publication.title,
    oneLine: project.publication.oneLine,
    audience: project.publication.audience,
    problem: project.publication.problem,
    category: project.publication.category,
    featureTags: project.publication.featureTags,
    experienceInstructions: project.publication.experienceInstructions,
    learningReflection: project.publication.learningReflection,
    cover: project.publication.coverArtifactId
      ? publicArtifacts.get(project.publication.coverArtifactId)?.content ?? null
      : null,
    visuals: {
      background: project.launchVisuals.background,
      textColor: project.launchVisuals.textColor,
      icon: project.launchVisuals.icon,
      keywords: project.launchVisuals.keywords,
      layoutMode: project.launchVisuals.layoutMode,
      blocks: [...project.launchVisuals.blocks].sort((a, b) => a.order - b.order),
      screenshots,
    },
    preview: {
      title: project.title,
      scenario: project.scenario.context,
      intent: project.intent.statement,
      pages: project.pages
        .filter((page) => project.publication.featuredPageIds.includes(page.id))
        .map(({ id, name, order }) => ({ id, name, order })),
      styleTokens: project.styleTokens,
      components: project.components.map(({ id, pageId, type, name, props }) => ({ id, pageId, type, name, props })),
      interactions: project.interactions,
      inputs: project.inputs,
      conditions: project.conditions,
      state: project.state,
    },
    story,
    versions: project.versions
      .filter((version) => ["App 1.0", "修复版 1.1", "试玩升级版 2.0"].includes(version.label))
      .map(({ label, description, changes }) => ({ label, description, changes })),
    presentation,
    finalScript: project.studentPresentation.minuteScript.finalText ||
      project.studentPresentation.minuteScript.studentDraft,
    publication: {
      url: project.publication.url,
      publishedAt: project.publication.publishedAt,
    },
  };
}
