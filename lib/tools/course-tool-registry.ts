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
  tool("intent-canvas", "意图画布", 1, [], ["title", "audience", "scenario", "intent"], "跟随任务卡完成首次应用意图", "从空白意图画布开始创造", ["应用有名称", "目标用户与任务意图已记录"], "IntentCanvasTool"),
  tool("project-boundary", "项目边界", 2, ["title", "audience", "scenario", "intent"], ["scope", "pages", "decisions"], "用必做清单定义应用边界", "自由增删范围与核心流程", ["至少有一项必做功能", "核心流程可以讲清楚"], "ProjectBoundaryTool"),
  tool("page-structure", "页面骨架", 3, ["scope", "pages"], ["pages", "structure", "artifacts"], "用推荐区块搭建单页骨架", "自由组合页面和层级", ["节点顺序有效", "每个节点属于有效页面"], "PageStructureTool"),
  tool("appearance-theme", "外观主题", 4, ["audience", "pages", "structure"], ["styles", "decisions", "artifacts"], "选择主题并调整关键样式", "自由编辑设计令牌", ["颜色值有效", "文字对比可读"], "AppearanceThemeTool"),
  tool("component-center", "组件中心", 5, ["scope", "pages", "structure", "styles"], ["components", "pages", "structure"], "安装推荐组件", "自由组合已支持组件", ["组件属于有效页面", "关键组件齐全"], "ComponentCenterTool"),
  tool("click-event", "点击事件", 6, ["components"], ["interactions", "tests", "artifacts"], "按触发—动作—反馈配置点击机关", "自由配置点击效果", ["触发目标存在", "点击后产生可见反馈"], "ClickEventTool"),
  tool("input-output", "输入输出", 7, ["components", "interactions"], ["inputs", "interactions", "tests"], "连接输入框与结果区", "自由定义输入输出映射", ["输入可接收内容", "输出能展示结果"], "InputOutputTool"),
  tool("condition-branch", "条件判断", 8, ["inputs", "interactions"], ["conditions", "interactions", "tests"], "使用二选一路线卡", "自由设置条件和分支", ["真假分支均可到达", "边界输入已测试"], "ConditionBranchTool"),
  tool("state-memory", "状态记忆", 9, ["interactions", "conditions"], ["state", "tests", "decisions"], "保存一个关键操作状态", "自由定义项目状态", ["状态会更新", "刷新恢复符合设计"], "StateMemoryTool"),
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
      return context.completedLessonIds?.includes("lesson-01") === true;
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
