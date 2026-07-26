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
  tool("app-composer", "应用合成", 10, ["pages", "structure", "styles", "components", "interactions", "inputs", "conditions", "state"], ["artifacts", "tests", "versions", "decisions"], "按检查单合成应用 1.0", "自由选择合成范围", ["核心流程可以走通", "已生成 1.0 快照"], "AppComposerTool"),
  tool("bug-scanner", "故障扫描", 11, ["artifacts", "tests", "versions"], ["tests", "decisions", "artifacts", "versions"], "按提示定位并修复故障", "自由建立测试清单", ["失败测试有原因", "修改后重新测试"], "BugScannerTool"),
  tool("playtest-feedback", "试玩反馈", 12, ["artifacts", "tests", "versions", "decisions"], ["feedback", "decisions", "tests", "artifacts", "versions"], "按反馈模板完成互评", "自由记录与采纳反馈", ["反馈具体可行动", "已形成 2.0 快照"], "PlaytestFeedbackTool"),
  tool("work-publisher", "作品发布", 13, ["title", "audience", "scenario", "intent", "scope", "pages", "structure", "styles", "components", "interactions", "inputs", "conditions", "state", "tests", "artifacts", "decisions", "feedback", "versions"], ["publication", "artifacts", "tests", "decisions", "versions"], "完成发布检查单", "自由编写发布介绍", ["关键测试通过", "发布信息完整"], "WorkPublisherTool"),
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
      return (project?.versions.length ?? 0) > 0;
    case "playtest-feedback":
      return (project?.versions.length ?? 0) > 1;
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
