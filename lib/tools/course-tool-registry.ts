import type { ProjectDocument, ProjectTopLevelField } from "@/lib/projects/project-document";

export type CourseToolMode = {
  summary: string;
  capabilities: readonly string[];
};

export type CourseToolDefinition = {
  id: string;
  name: string;
  lessonId: string;
  lessonOrder: number;
  unlockCondition: string;
  inputFields: readonly ProjectTopLevelField[];
  outputFields: readonly ProjectTopLevelField[];
  basicMode: CourseToolMode;
  freeMode: CourseToolMode;
  testRules: readonly string[];
  projectMutation: string;
  reactComponent: string;
};

const tool = (
  id: string,
  name: string,
  lessonOrder: number,
  inputFields: ProjectTopLevelField[],
  outputFields: ProjectTopLevelField[],
  basic: string,
  free: string,
  testRules: string[],
  reactComponent: string,
): CourseToolDefinition => ({
  id,
  name,
  lessonId: `lesson-${String(lessonOrder).padStart(2, "0")}`,
  lessonOrder,
  unlockCondition:
    lessonOrder === 1 ? "进入第 1 课后解锁" : `进入第 ${lessonOrder} 课后解锁`,
  inputFields,
  outputFields,
  basicMode: { summary: basic, capabilities: ["步骤提示", "示例起点", "即时校验"] },
  freeMode: { summary: free, capabilities: ["自由编辑", "自定命名", "自主测试"] },
  testRules,
  projectMutation: `只允许修改：${outputFields.join("、")}`,
  reactComponent,
});

export const courseToolRegistry: readonly CourseToolDefinition[] = [
  tool("intent-canvas", "意图画布", 1, [], ["title", "audience", "scenario", "intent", "inspirationSources", "interestMap", "sketch", "keywords", "aiDraft", "studentRevision", "finalIntent", "aiMode", "aiProvenance", "pages", "structure", "styles", "components", "decisions", "artifacts", "tests"], "探索生活场景，建立兴趣地图并确认首个网页意图", "继续修订场景、画板、意图与网页原型", ["画板和关键词已保存", "学生修改并确认 AI 意图", "网页原型反映最终意图"], "IntentCanvasTool"),
  tool("project-boundary", "项目边界", 2, ["title", "audience", "scenario", "intent", "finalIntent", "interestMap", "artifacts"], ["scope", "pages", "components", "decisions", "artifacts", "tests"], "用功能星系和三格故事板定义应用边界", "自由调整功能范围与三步用户故事", ["至少一个核心功能", "三格故事完整", "范围不过大"], "ProjectBoundaryTool"),
  tool("page-structure", "页面骨架", 3, ["finalIntent", "scope", "pages", "sketch", "interestMap", "artifacts"], ["pages", "structure", "aiDrafts", "studentRevisions", "decisions", "artifacts", "tests"], "观察网页透视、绘制页面草图并修改 AI 结构建议", "自主创建页面层级并安全修改 HTML", ["透视区域与 HTML 标签同步", "HTML 层级有效", "学生确认最终结构"], "PageStructureStudio"),
  tool("appearance-theme", "外观主题", 4, ["finalIntent", "audience", "pages", "structure", "interestMap", "sketch"], ["styles", "styleTokens", "moodboard", "aiDrafts", "studentRevisions", "decisions", "artifacts", "tests"], "组合推荐情绪板并逐项确认 StyleTokens", "导入参考图并自由编辑全部视觉参数", ["候选色彩可追溯", "文字对比可读", "平板预览通过"], "MoodboardThemeStudio"),
  tool("component-center", "组件中心", 5, ["scope", "pages", "structure", "styles", "styleTokens"], ["components", "customComponentBriefs", "aiDrafts", "studentRevisions", "decisions", "artifacts", "tests", "pages", "structure"], "操作组件馆并安装推荐组件组合", "自由组装页面并绘制安全自定义组件", ["组件可操作", "组件属于有效页面", "预览只执行注册组件"], "ComponentStudio"),
  tool("click-event", "点击事件", 6, ["components"], ["interactions", "components", "tests", "decisions", "artifacts"], "按触发—动作—反馈配置点击机关", "组合多个安全反馈并修改局部参数", ["第一次点击有反馈", "连续点击正确", "重置回到起点"], "EventBuilder"),
  tool("input-output", "输入输出", 7, ["components", "interactions"], ["inputs", "components", "interactions", "tests", "artifacts"], "用模板连接输入、处理与结果", "自由定义输入限制与结果表达", ["正常输入通过", "空输入有提示", "异常输入可修复"], "InputOutputBuilder"),
  tool("condition-branch", "条件判断", 8, ["inputs", "interactions"], ["conditions", "interactions", "tests", "decisions", "artifacts"], "使用两至三条条件句式", "自由调整比较值和路线结果", ["条件不重复", "真假路线可达", "边界值已测试"], "ConditionBuilder"),
  tool("state-memory", "状态记忆", 9, ["inputs", "interactions", "conditions"], ["state", "interactions", "tests", "decisions", "artifacts"], "保存一个关键操作状态", "自由设计项目内的记忆旅程", ["状态会更新和清空", "刷新恢复符合设计", "项目之间互不读取"], "StateBuilder"),
  tool("app-composer", "应用流程编排器", 10, ["finalIntent", "scope", "pages", "structure", "styles", "components", "interactions", "inputs", "conditions", "state", "tests"], ["appFlow", "testScenarios", "artifacts", "tests", "versions", "decisions"], "可视化组织页面、角色试航并逐项决定 AI 体验检查", "自由排序、连接、删减并查看完整代码结构", ["核心流程可以走通", "至少一次角色试航", "至少修复一个中断点", "已生成 App 1.0"], "AppFlowComposer"),
  tool("bug-scanner", "Bug 标注工作室", 11, ["appFlow", "testScenarios", "artifacts", "tests", "versions", "components"], ["bugAnnotations", "bugReports", "aiDebugDrafts", "studentFixes", "tests", "decisions", "artifacts", "versions"], "在应用截图上标注、复现并比较本地调试草稿", "自由关联代码日志、修改局部方案并复测", ["截图标注和复现完整", "比较并修改多个建议", "查看局部代码差异", "已生成修复版 1.1"], "BugAnnotationStudio"),
  tool("playtest-feedback", "同伴试玩工作室", 12, ["appFlow", "testScenarios", "bugAnnotations", "artifacts", "tests", "versions", "decisions"], ["testScenarios", "bugAnnotations", "peerReviews", "experienceCurves", "decisions", "tests", "artifacts", "versions"], "在同一浏览器进入只读试玩并绘制体验曲线", "自由整理反馈、选择升级问题并对比版本", ["App 正文只读", "反馈与情绪曲线完整", "同一任务重新测试", "已形成试玩升级版 2.0"], "PeerReviewStudio"),
  tool("work-publisher", "造物发布", 13, ["title", "audience", "scenario", "intent", "interestMap", "sketch", "aiDraft", "studentRevision", "finalIntent", "scope", "pages", "structure", "styles", "styleTokens", "moodboard", "components", "interactions", "inputs", "conditions", "state", "appFlow", "bugReports", "peerReviews", "tests", "artifacts", "decisions", "feedback", "versions", "projectStory", "launchVisuals", "presentationDraft", "studentPresentation", "demoScript"], ["projectStory", "launchVisuals", "presentationDraft", "studentPresentation", "demoScript", "publication", "finalVersion", "artifacts", "tests", "decisions", "versions"], "按故事、视觉、介绍、演示和访客测试完成发布", "自由重组故事与发布版式并生成公开作品页", ["造物轨迹已选择排序", "封面与代表页面已确认", "AI原稿经过逐项修改", "一分钟演示不超时", "公开投影通过隐私检查"], "WorkPublisherTool"),
] as const;

export type ToolUnlockContext = {
  availableLessonIds: readonly string[];
  completedLessonIds?: readonly string[];
  project?: ProjectDocument;
};

export function getCourseTool(toolId: string) {
  return courseToolRegistry.find((item) => item.id === toolId) ?? null;
}

export function isCourseToolUnlocked(
  definition: CourseToolDefinition,
  context: ToolUnlockContext,
) {
  if (!context.availableLessonIds.includes(definition.lessonId)) return false;
  const project = context.project;
  switch (definition.id) {
    case "intent-canvas":
      return true;
    case "click-event":
      return (project?.components.length ?? 0) > 0;
    case "project-boundary":
      return Boolean(project?.finalIntent) ||
        context.completedLessonIds?.includes("lesson-01") === true;
    case "page-structure":
      return (project?.scope.coreFlow.length ?? 0) > 0;
    case "appearance-theme":
      return (project?.structure.length ?? 0) > 0;
    case "component-center":
      return project?.styles.selectedThemeId !== null;
    case "input-output":
      return (project?.interactions.length ?? 0) > 0;
    case "condition-branch":
      return (project?.inputs.length ?? 0) > 0;
    case "state-memory":
      return (project?.conditions.length ?? 0) > 0;
    case "app-composer":
      return (project?.interactions.length ?? 0) > 0;
    case "bug-scanner":
      return project?.versions.some((item) => item.label === "App 1.0") === true;
    case "playtest-feedback":
      return project?.versions.some((item) => item.label === "修复版 1.1") === true;
    case "work-publisher":
      return (project?.versions.length ?? 0) > 2;
    default:
      return false;
  }
}

export function applyToolChanges(
  project: ProjectDocument,
  definition: CourseToolDefinition,
  changes: Partial<Pick<ProjectDocument, ProjectTopLevelField>>,
) {
  const requested = Object.keys(changes) as ProjectTopLevelField[];
  const denied = requested.filter((field) => !definition.outputFields.includes(field));
  if (denied.length > 0) {
    throw new Error(`${definition.name}不能修改：${denied.join("、")}`);
  }
  return { ...project, ...changes };
}
