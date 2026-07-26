import type { ProjectDocument } from "../projects/project-document.ts";

export type AppFlow = ProjectDocument["appFlow"];

export function composeInitialFlow(project: ProjectDocument): AppFlow {
  const pages = [...project.pages].sort((a, b) => a.order - b.order);
  const nodes = pages.map((page, order) => ({
    pageId: page.id,
    label: page.name,
    order,
    enabled: true,
  }));
  const connections: AppFlow["connections"] = nodes.slice(0, -1).map((node, index) => ({
    id: `flow-${node.pageId}-${nodes[index + 1].pageId}`,
    fromPageId: node.pageId,
    toPageId: nodes[index + 1].pageId,
    kind: "next" as const,
  }));
  const first = nodes[0]?.pageId ?? null;
  const last = nodes.at(-1)?.pageId ?? null;
  if (first && last && first !== last) {
    connections.push({
      id: `flow-${last}-${first}-restart`,
      fromPageId: last,
      toPageId: first,
      kind: "restart",
    });
  }
  return {
    nodes,
    connections,
    startPageId: first,
    coreEntryPageId: first,
    resultPageId: last,
    simulationRoles: ["目标用户", "第一次使用者", "赶时间的用户"],
    completedVoyages: 0,
    experienceChecks: [],
  };
}

export function moveFlowNode(
  flow: AppFlow,
  pageId: string,
  direction: -1 | 1,
): AppFlow {
  const enabled = flow.nodes
    .filter((node) => node.enabled)
    .sort((a, b) => a.order - b.order);
  const index = enabled.findIndex((node) => node.pageId === pageId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= enabled.length) return flow;
  const reordered = [...enabled];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  const orderById = new Map(reordered.map((node, order) => [node.pageId, order]));
  return {
    ...flow,
    nodes: flow.nodes.map((node) => ({
      ...node,
      order: orderById.get(node.pageId) ?? node.order,
    })),
  };
}

export function validateAppFlow(flow: AppFlow) {
  const enabledIds = new Set(
    flow.nodes.filter((node) => node.enabled).map((node) => node.pageId),
  );
  const problems: string[] = [];
  if (!flow.startPageId || !enabledIds.has(flow.startPageId)) problems.push("缺少有效起点");
  if (!flow.coreEntryPageId || !enabledIds.has(flow.coreEntryPageId)) problems.push("缺少核心入口");
  if (!flow.resultPageId || !enabledIds.has(flow.resultPageId)) problems.push("缺少结果页");
  if (enabledIds.size < 2) problems.push("完整 App 至少需要两个启用页面");
  const nextFrom = new Set(
    flow.connections
      .filter((edge) => edge.kind === "next" && enabledIds.has(edge.fromPageId) && enabledIds.has(edge.toPageId))
      .map((edge) => edge.fromPageId),
  );
  for (const node of flow.nodes.filter((item) => item.enabled)) {
    if (node.pageId !== flow.resultPageId && !nextFrom.has(node.pageId)) {
      problems.push(`${node.label}没有通往下一页`);
    }
  }
  if (!flow.connections.some((edge) => edge.kind === "return" || edge.kind === "restart")) {
    problems.push("缺少返回或重新开始");
  }
  return problems;
}

export function createExperienceChecks(project: ProjectDocument) {
  const flowProblems = validateAppFlow(project.appFlow);
  const enabledCount = project.appFlow.nodes.filter((node) => node.enabled).length;
  const hasInput = project.inputs.length > 0;
  const hasFeedback = project.interactions.length > 0;
  const passedTests = project.tests.filter((item) => item.status === "pass").length;
  const intent = project.finalIntent?.appIntent || project.intent.statement || project.title;
  return [
    {
      id: "entry",
      question: "是否能找到入口",
      finding: project.appFlow.coreEntryPageId ? "已设置核心入口" : "核心入口尚未设置",
      suggestion: "让起点页面只保留一个最醒目的核心入口。",
      studentResponse: null,
      studentNote: "",
    },
    {
      id: "input",
      question: "是否理解输入",
      finding: hasInput ? `检测到 ${project.inputs.length} 个输入定义` : "未检测到输入说明",
      suggestion: "在输入前说明要填什么，并在空输入时给出提示。",
      studentResponse: null,
      studentNote: "",
    },
    {
      id: "feedback",
      question: "是否获得反馈",
      finding: hasFeedback
        ? `检测到 ${project.interactions.length} 个互动反馈；${passedTests}/${project.tests.length} 项既有测试通过`
        : `操作后缺少可见反馈；${passedTests}/${project.tests.length} 项既有测试通过`,
      suggestion: "关键操作后显示结果、状态或下一步。",
      studentResponse: null,
      studentNote: "",
    },
    {
      id: "return",
      question: "是否能返回",
      finding: flowProblems.some((item) => item.includes("返回"))
        ? "流程中没有返回或重新开始"
        : "已设置返回或重新开始",
      suggestion: "在结果页加入重新开始，长流程加入返回。",
      studentResponse: null,
      studentNote: "",
    },
    {
      id: "waste",
      question: "是否有无用步骤",
      finding: enabledCount > Math.max(2, project.scope.coreFlow.length + 1)
        ? "页面数多于核心流程，可能存在绕路"
        : "流程长度与核心任务接近",
      suggestion: "删除不能帮助用户完成核心任务的页面或功能。",
      studentResponse: null,
      studentNote: "",
    },
    {
      id: "intent",
      question: "是否偏离最初意图",
      finding: `当前流程需要继续服务：${intent}`,
      suggestion: "逐页说明它如何帮助最初的服务对象完成任务。",
      studentResponse: null,
      studentNote: "",
    },
  ] satisfies AppFlow["experienceChecks"];
}

export function generateReproductionSteps(
  beforeActions: string[],
  pageName: string,
  afterActions: string[],
) {
  return [
    `打开 ${pageName}`,
    ...beforeActions.filter(Boolean),
    "执行被标注的操作",
    ...afterActions.filter(Boolean),
    "对照预期结果与实际结果",
  ];
}

export function createDemoDebugDraft(
  report: ProjectDocument["bugReports"][number],
): ProjectDocument["aiDebugDrafts"][number] {
  return {
    id: `debug-${report.id}`,
    bugReportId: report.id,
    mode: "demo",
    disclaimer: "本地规则演示：未连接真实 AI，不理解截图内容，只根据标注、复现步骤、代码关键词与测试日志生成候选检查项。",
    inputSummary: [
      `问题类型：${report.type}`,
      `复现步骤：${report.reproSteps.length} 步`,
      `关联组件：${report.componentIds.join("、") || "未关联"}`,
      `日志：${report.testLog.join("；") || "无"}`,
    ],
    suggestions: [
      {
        id: `${report.id}-suggestion-a`,
        cause: "事件入口或反馈状态没有在同一组件中更新",
        checkLocation: report.componentIds[0] || "主操作组件",
        fix: "只修改关联组件的事件处理与反馈状态，不改动其他页面。",
        risk: "可能影响连续点击或返回后的状态。",
        retest: "按原复现步骤测试一次，再测试连续操作与重新开始。",
      },
      {
        id: `${report.id}-suggestion-b`,
        cause: "输入边界或条件顺序导致流程提前中断",
        checkLocation: report.codeExcerpt ? "当前代码差异中的条件分支" : "输入与条件定义",
        fix: "先补边界提示，再调整最小范围的判断顺序。",
        risk: "可能改变临界值对应的结果。",
        retest: "测试空值、正常值、边界值和超范围值。",
      },
      {
        id: `${report.id}-suggestion-c`,
        cause: "页面连接存在断点或结果页没有返回路线",
        checkLocation: "appFlow.connections",
        fix: "补一条局部连接，保留现有页面和功能。",
        risk: "新增连接可能形成循环。",
        retest: "用目标用户角色完成一次全流程并重新开始。",
      },
    ],
  };
}

export function clusterPeerReviews(reviews: ProjectDocument["peerReviews"]) {
  const groups = new Map<string, typeof reviews>();
  for (const review of reviews) {
    const key = `${review.pageId}:${review.problemType}:${review.severity}`;
    groups.set(key, [...(groups.get(key) ?? []), review]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    count: items.length,
    pageId: items[0].pageId,
    problemType: items[0].problemType,
    severity: items[0].severity,
    summary: items.map((item) => item.suggestion || item.note).filter(Boolean).join("；"),
  }));
}

export function compareVersions(
  before: ProjectDocument["versions"][number],
  after: ProjectDocument["versions"][number],
) {
  return {
    from: before.label,
    to: after.label,
    addedChanges: after.changes.filter((change) => !before.changes.includes(change)),
    testChanged: before.testSummary !== after.testSummary,
    peerFeedbackAdded: after.peerFeedback.length - before.peerFeedback.length,
  };
}
