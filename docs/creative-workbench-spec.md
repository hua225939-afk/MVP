# 造物星球·创造台产品与技术规格

## 1. 定位

“造物星球·创造台”是 13 节课程共同使用的开放创造环境。它不是课程之外的第二套系统，也不是只服务某一课的一次性编辑器。

同一名学生在第 01 课创建一个 App 和一份 `ProjectDocument`，之后从课程页或创造台进入时，都读取并修改这份项目。课程页提供“看、讲、想、做、测、说”的教学引导、解锁和完成判断；创造台提供持续编辑、预览、测试、版本与发布能力。

### 1.1 目标

- 让 13 课形成连续作品，而不是 13 个孤立练习。
- 让课程工具逐课解锁，同时允许学生在已解锁范围内自由创造。
- 让每次操作、测试、修改、决策和版本都有结构化记录。
- 让学生、教师、家长及其他角色读取同一数据事实的不同投影。
- 第一阶段使用 localStorage，但从第一天通过 Repository/Store 契约为数据库迁移做准备。

### 1.2 非目标

- 不复制一套独立于课程 JSON、`LessonRenderer` 和学习进度的课程系统。
- 不为 13 课分别建立 13 个专用编辑器。
- 不在当前阶段引入真实登录、数据库、支付、真实 AI 或任意代码执行。
- 不把模拟发布描述成已具备真实公网托管能力。

## 2. 最终页面结构

### 2.1 顶部全局导航

| 导航 | 作用 | 主要数据 |
| --- | --- | --- |
| 创造基地 | 返回学生总览、课程地图和继续学习入口 | 课程清单、学习进度、当前项目摘要 |
| 创造台 | 打开当前 App 的持续创作空间 | `ProjectDocument` |
| 我的作品 | 查看当前 App、历史版本和允许保留的其他作品 | 项目索引、`artifacts`、`versions` |
| 学习中心 | 查看 5 单元、13 课、解锁和完成状态 | 课程 JSON、学习进度 |
| 作品广场 | 查看允许公开或模拟公开的作品 | `publication` 的角色安全投影 |
| 成就 | 查看课程和创造里程碑 | 学习进度、测试与发布里程碑 |

顶部始终显示当前 App 名称、保存状态、当前版本和演示模式标识。切换页面不会创建新项目。

### 2.2 左侧插件中心

插件按课程逐步解锁，已解锁工具可以在自由模式中继续使用。

| 顺序 | 工具 | 对应课次 | 主要项目字段 |
| --- | --- | --- | --- |
| 1 | 意图画布 | 第 01 课 | `title/audience/scenario/intent` |
| 2 | 项目边界 | 第 02 课 | `scope/pages/decisions` |
| 3 | 页面骨架 | 第 03 课 | `pages/structure` |
| 4 | 外观主题 | 第 04 课 | `styles/decisions` |
| 5 | 组件中心 | 第 05 课 | `components/pages/structure` |
| 6 | 点击事件 | 第 06 课 | `interactions/tests` |
| 7 | 输入输出 | 第 07 课 | `inputs/interactions/tests` |
| 8 | 条件判断 | 第 08 课 | `conditions/interactions/tests` |
| 9 | 状态记忆 | 第 09 课 | `state/tests` |
| 10 | 应用合成 | 第 10 课 | `artifacts/tests/versions` |
| 11 | 故障扫描 | 第 11 课 | `tests/decisions/versions` |
| 12 | 试玩反馈 | 第 12 课 | `feedback/decisions/tests/versions` |
| 13 | 作品发布 | 第 13 课 | `publication/artifacts/versions` |

插件状态包括：`locked`、`available`、`active`、`completed`。未解锁时可查看用途说明，但不能写入项目。

### 2.3 中间创造画布

| 页签/动作 | 作用 | 第一阶段边界 |
| --- | --- | --- |
| 画布 | 结构化编辑页面、组件和连接关系 | 由工具注册信息决定可编辑字段 |
| 代码 | 查看或在允许课次内编辑受控代码产物 | 不执行任意代码；明确展示代码来源 |
| 应用预览 | 使用当前 `ProjectDocument` 渲染 App | 与课程页读取同一最新修订 |
| 测试 | 运行注册工具定义的规则，记录失败、修改和重试 | 现有 `contains` 仅为字符串规则检查 |
| 版本对比 | 比较两个项目快照的字段和可见结果 | 第 10 课起正式使用 |
| 发布 | 打开发布检查和发布确认 | 第 13 课解锁；真实托管方式待确认 |

画布顶部提供当前页面、设备视口（电脑/平板）、撤销/重做、保存状态和版本标识。第一阶段至少保存显式保存点；自动保存频率属于待确认交互决策。

### 2.4 右侧创造助手

| 入口 | 行为 |
| --- | --- |
| 我有想法 | 把学生描述映射到当前已解锁工具的结构化输入 |
| 我不知道从哪里开始 | 根据当前课次、缺失字段和失败测试提供起步选项 |
| 帮我拆解任务 | 将目标拆为页面、组件、交互和验证项，不直接替学生发布 |
| 解释代码 | 解释当前选中片段与项目字段的关系 |
| 给我提示 | 按“方向提示→定位提示→具体提示”逐级提供线索 |
| 帮我检查问题 | 调用当前工具的测试规则，展示证据和建议返回位置 |

第一阶段助手使用课程 JSON 和工具注册表中的预设内容，不宣称连接真实 AI。助手建议只有在学生确认后才能生成 `ProjectPatch`；不能静默改写项目。

### 2.5 底部抽屉

| 抽屉 | 内容 |
| --- | --- |
| 技能工具 | 已解锁工具、核心概念、使用记录和待完成项 |
| 造物轨迹 | 按时间显示课程、操作、决策、保存和里程碑 |
| 测试记录 | 测试规则、输入版本、通过/失败、重试次数和修复关联 |
| 版本记录 | 版本号、来源课次、说明、创建时间和对比/恢复入口 |

## 3. 统一 ProjectDocument

### 3.1 目标结构

以下为概念结构；实施时必须用 Zod 定义严格 Schema，并给嵌套对象稳定 ID。

```ts
type ProjectDocument = {
  schemaVersion: number;
  revision: number;
  projectId: string;
  studentId: string;
  courseId: string;
  title: string;
  audience: {
    primary: string;
    needs: string[];
  };
  scenario: {
    context: string;
    problem: string;
  };
  intent: {
    statement: string;
    expectedOutcome: string;
  };
  scope: {
    mustHave: string[];
    shouldHave: string[];
    outOfScope: string[];
    coreFlow: string[];
  };
  pages: ProjectPage[];
  structure: StructureNode[];
  styles: {
    themes: ThemeOption[];
    selectedThemeId: string | null;
    tokens: Record<string, string>;
  };
  components: ProjectComponent[];
  interactions: ProjectInteraction[];
  inputs: ProjectInput[];
  conditions: ProjectCondition[];
  state: ProjectStateDefinition[];
  tests: ProjectTestRecord[];
  artifacts: ProjectArtifact[];
  decisions: ProjectDecision[];
  feedback: ProjectFeedback[];
  versions: ProjectVersion[];
  publication: {
    status: "not_ready" | "ready" | "published_demo" | "published";
    versionId: string | null;
    title: string;
    description: string;
    coverArtifactId: string | null;
    visibility: "private" | "class" | "public";
    safetyChecks: PublicationCheck[];
    url: string | null;
    qrCodeArtifactId: string | null;
    publishedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
```

`studentId`、`courseId`、`schemaVersion`、`revision` 和时间字段是持久化与迁移必需元数据；它们不替代用户要求的业务字段。

### 3.2 字段责任

| 字段 | 责任 |
| --- | --- |
| `projectId` | 贯穿 13 课的稳定项目身份 |
| `title/audience/scenario/intent` | 为什么做、为谁做、解决什么 |
| `scope` | 核心任务、边界与用户流程 |
| `pages/structure` | 页面及内容层级 |
| `styles` | 主题候选、最终选择与设计令牌 |
| `components` | 可复用界面组件实例及配置 |
| `interactions/inputs/conditions/state` | 运行行为的四个层次 |
| `tests` | 测试定义、尝试、证据、结果和修复关联 |
| `artifacts` | 可预览代码、截图、封面、说明等产物引用 |
| `decisions` | 学生做出的选择、理由和是否由建议触发 |
| `feedback` | 同伴/教师反馈、优先级和采纳状态 |
| `versions` | 关键快照的元数据与可恢复引用 |
| `publication` | 发布候选、检查、可见范围、链接和状态 |

### 3.3 每课读写字段

| 课次 | 读取 | 写入或更新 |
| --- | --- | --- |
| 01 | 无项目；读取课程引导 | `projectId/title/audience/scenario/intent/artifacts/decisions/versions` |
| 02 | `title/audience/scenario/intent` | `scope/pages/decisions` |
| 03 | `scope/pages` | `pages/structure/artifacts/tests` |
| 04 | `audience/pages/structure` | `styles/decisions/tests/artifacts` |
| 05 | `scope/pages/structure/styles` | `components/pages/structure/tests` |
| 06 | `components` | `interactions/tests/decisions/artifacts` |
| 07 | `components/interactions` | `inputs/interactions/tests` |
| 08 | `inputs/interactions` | `conditions/interactions/tests` |
| 09 | `inputs/conditions/interactions` | `state/tests/decisions` |
| 10 | 前述全部功能字段 | `artifacts/tests/versions/decisions`，形成 1.0 |
| 11 | `artifacts/tests/versions` | `tests/decisions/artifacts/versions`，形成 1.1 |
| 12 | `artifacts/tests/versions/decisions` | `feedback/decisions/tests/artifacts/versions`，形成 2.0 |
| 13 | 完整项目和 2.0 | `publication/artifacts/tests/decisions/versions` |

所有课次都可以追加本课造物轨迹，但不得越权修改尚未解锁工具负责的字段。

## 4. 课程页与创造台双向同步

### 4.1 唯一数据事实

```text
课程 JSON ──定义教学与工具调用──┐
                               ├─ CourseToolHost ── ProjectRepository ── ProjectDocument
创造台 ──选择同一 projectId────┘
```

- 课程 JSON 不保存学生项目内容，只声明本课读取字段、允许写入字段、工具 ID、完成条件和造物档案映射。
- `LessonRenderer` 继续渲染课程互动；涉及项目修改的互动通过 `CourseToolHost` 调用工具注册表，而不是各自写 localStorage。
- 创造台也通过同一个工具注册表和 `ProjectRepository` 提交修改。
- 任何修改先形成 `ProjectPatch`：`projectId/baseRevision/source/lessonId/toolId/changes/decision`。
- Repository 校验基础修订、字段权限和目标 Schema 后，原子写入并增加 `revision`。

### 4.2 同步规则

1. 课程页进入“做”时打开当前项目和对应工具，可采用嵌入视图或跳转创造台；URL 必须携带稳定 `projectId/lessonId/toolId`。
2. 创造台保存成功后，课程页立刻读取新修订并重新计算测试与完成条件。
3. 课程页产生的结构化输入同样写入项目，创造台重新打开时必须可见。
4. 同一标签页使用 Store 订阅或自定义事件同步；不同标签页使用浏览器 `storage` 事件同步。
5. `revision` 不匹配时不静默覆盖，提示重新加载最新版本并重新应用当前修改。
6. 学习进度只记录“课程完成到哪里”；项目文档记录“App 当前是什么”。两者互相引用但不互相复制。
7. 教师预览注入只读 Repository；即使互动组件可点击，也不能提交 ProjectPatch。

## 5. localStorage 保存

### 5.1 建议键

```text
vibe-coding:v1:project-index:{studentId}:{courseId}
vibe-coding:v1:project:{studentId}:{projectId}
vibe-coding:v1:progress:{studentId}:{courseId}
vibe-coding:v1:session
```

项目文档采用“一项目一键”，索引只保存 `projectId/title/updatedAt/currentVersion/status`，避免列表页扫描全部存储。

### 5.2 保存与恢复

- 第 01 课明确创建项目；其余课先解析项目索引，再读取同一 `projectId`。
- 所有读取和写入通过 Zod；损坏数据不直接渲染，保留开发警告和可恢复副本。
- 每次工具确认、测试完成、造物档案保存和版本创建后写入；未确认的输入草稿是否自动保存待交互决策确认。
- 写入前检查 `schemaVersion` 和 `revision`，写入后回读校验。
- 版本快照可先存于 `versions` 的受控 snapshot；若容量证明不足，再在不改 Repository 契约的前提下拆分版本键或迁移 IndexedDB。
- localStorage 仅保证当前浏览器演示，不承诺跨设备、多浏览器或多人实时协作。

## 6. 教师、家长与其他角色读取

### 6.1 角色投影

| 角色 | 读取内容 | 禁止内容/行为 |
| --- | --- | --- |
| 学生 | 完整本人项目和编辑能力 | 不编辑他人项目 |
| 教师 | 项目摘要、课程字段完成度、测试、版本、作品预览和允许的反馈入口 | 课程预览不得写学生项目；不读取无关班级 |
| 家长 | 标题、用途、阶段成果、关键版本、公开作品、成长摘要 | 不展示复杂代码、详细调试日志或同伴隐私 |
| 合作伙伴 | 所属校区聚合进度、项目数量、发布数量 | 不读取项目正文和学生私人反馈 |
| 总部 | 全局聚合、课程工具使用和版本分布 | 不以分析页面改写学生项目 |

第一阶段由 `DemoProjectRepository` 合并共享 mock baseline 与当前浏览器 localStorage override。同一浏览器切换角色时，教师和家长可读取同一项目的只读投影，不能另造冲突的作品副本。

### 6.2 摘要生成

- 教师数据由项目字段、测试记录和学习进度计算，不手写第二套完成率。
- 家长摘要来自课程 JSON 的家长文案模板与项目安全字段，不直接展示 `artifacts` 中的代码。
- 聚合统计由项目明细计算，不把“作品数、完成数、发布数”保存为独立事实。

## 7. 迁移到数据库

1. 保持 `ProjectRepository`、`ProjectPatch`、角色投影和工具注册契约不变。
2. 冻结当前 Zod Schema 与迁移函数，给每个 ProjectDocument 稳定 `projectId/studentId/courseId`。
3. 建立项目、版本、测试、反馈和发布记录的服务端存储；大代码或图片产物使用对象存储引用。
4. 用同一契约测试实现 `ApiProjectRepository`，再替换 `LocalProjectRepository`。
5. 真实登录后所有读取和 patch 都在服务端按 session 授权；前端隐藏按钮不是权限边界。
6. 首次登录检测本地项目：云端无记录时经用户确认导入；两边都有记录时提供版本对比/合并，不按时间静默覆盖。
7. 多人试玩或协作若进入后续范围，再基于 revision/乐观锁扩展；本阶段不预建实时协作系统。

## 8. 课程工具注册机制

### 8.1 统一定义

```ts
type CourseToolDefinition = {
  id: string;
  name: string;
  lessonIds: string[];
  unlock: ToolUnlockRule;
  input: ProjectFieldPath[];
  output: ProjectFieldPath[];
  basicMode: ToolModeDefinition;
  freeMode: ToolModeDefinition;
  testRules: ToolTestRule[];
  projectMutation: ProjectMutationContract;
  component: React.ComponentType<CourseToolProps>;
};
```

| 必需项 | 规则 |
| --- | --- |
| `id` | 稳定 kebab-case，不使用课次数组下标 |
| 名称 | 学生可理解，和插件中心一致 |
| 对应课次 | 一个主要解锁课次；允许后续课复用 |
| 解锁条件 | 依赖课程完成、前置字段或教师演示开关 |
| 输入数据 | 明确只读 ProjectDocument 路径 |
| 输出数据 | 明确允许写入的路径 |
| 基础模式 | 课程内有脚手架、限制范围、逐级提示和强制测试 |
| 自由模式 | 已解锁后自主配置，但仍受 Schema、安全与字段权限约束 |
| 测试规则 | 规则 ID、前置条件、通过条件、失败提示和重试行为 |
| 项目修改 | 生成可审计 ProjectPatch，不直接调用 localStorage |
| React 组件 | 注册组件，不在 `LessonRenderer` 中为单课写条件分支 |

### 8.2 13 个工具注册定义

| `id` / 名称 / 课次 | 解锁条件 | 输入数据 | 输出数据 | 基础模式 | 自由模式 | 测试规则 | 对 ProjectDocument 的修改 | React 组件 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `intent-canvas` / 意图画布 / 01 | 进入第 01 课 | 课程案例；可选首次想法 | `title/audience/scenario/intent` | 按对象、问题、结果填写 | 重开并修订意图 | 四项非空、问题具体、结果可观察 | 创建项目并写意图字段，追加决定和首快照 | `IntentCanvasTool` |
| `project-boundary` / 项目边界 / 02 | 主项目存在且第 01 课完成 | `title/audience/scenario/intent` | `scope/pages/decisions` | 三个生活问题、一主两辅功能和优先级 | 自由调整范围 | 一句话可说明、三步内可完成、后续课程可实现 | patch 范围、三步流程和取舍 | `ProjectBoundaryTool` |
| `page-structure` / 页面骨架 / 03 | 第 02 课三步流程有效 | `scope/pages` | `pages/structure/artifacts` | 三案例透视、模块排列、半成品 HTML 补全 | 增删页面和结构节点 | 缺少结束标签、嵌套错误、空内容区 | patch 页面与结构，生成 HTML 骨架 | `PageStructureTool` |
| `appearance-theme` / 外观主题 / 04 | HTML 骨架测试通过 | `audience/pages/structure` | `styles/decisions/artifacts` | 活力/清新/科技主题比较与风格板 | 调整 CSS 变量和局部样式 | 对比度、字号、间距、窄屏；至少修复一处 | patch 视觉主题、CSS 和前后对比 | `AppearanceThemeTool` |
| `component-center` / 组件中心 / 05 | 主题和结构存在 | `scope/pages/structure/styles` | `components/pages/structure` | 选择三至四个组件并复制同类组件 | 复用已批准组件库 | 空内容、缺失属性、样式不统一、移动端错位 | patch 组件实例、属性及结构引用 | `ComponentCenterTool` |
| `click-event` / 点击事件 / 06 | 至少一个可操作组件 | `components` | `interactions/tests/artifacts` | 触发—动作—反馈连线 | 为已有组件配置受控事件 | 首次点击、连续点击、重置 | patch 事件并追加测试/修复证据 | `ClickEventTool` |
| `input-output` / 输入输出 / 07 | 第 06 课点击互动存在 | `components/interactions` | `inputs/interactions/tests` | 从文字、数字、下拉中选一种并连接实时输出 | 配置多种受控输入 | 正常、空白、过长或超范围输入 | patch 输入定义、提示和交互引用 | `InputOutputTool` |
| `condition-branch` / 条件判断 / 08 | 第 07 课输入数据存在 | `inputs/interactions` | `conditions/interactions/tests` | 两至三个条件、半成品 `if/else` 补全 | 扩展可测试判断 | 刚好等于、低于、高于边界 | patch 判断条件和反馈结果 | `ConditionBranchTool` |
| `state-memory` / 状态记忆 / 09 | 第 07—08 课输入和结果存在 | `inputs/conditions/interactions` | `state/tests/decisions` | 状态更新、localStorage、恢复和清空 | 配置要记住的内容 | 增加、删除、修改、重置、刷新恢复、清空；修复一次保存失败 | patch 状态、本地保存规则和测试证据 | `StateMemoryTool` |
| `app-composer` / 应用合成 / 10 | 第 02—09 课成果有效 | 所有功能字段 | `artifacts/tests/versions/decisions` | 勾选页面/模块，设置首页顺序、入口和结果页 | 重排已实现功能 | 入口、提示、互动、结果、保存；修复至少一个中断点 | 生成组合产物和 1.0 快照，不重建项目 | `AppComposerTool` |
| `bug-scanner` / 故障扫描 / 11 | 1.0 版本存在 | `artifacts/tests/versions` | `tests/decisions/artifacts/versions` | 故障工单、AI 求助指令、逐级提示和回归 | 自建故障工单与求助指令 | 原任务复测且其他功能回归；不固定 Bug 数量 | 追加问题、求助指令、修复证据并生成 1.1 | `BugScannerTool` |
| `playtest-feedback` / 试玩反馈 / 12 | 1.1 可完整试玩 | `artifacts/tests/versions/decisions` | `feedback/decisions/tests/artifacts/versions` | 试玩任务卡、独立试玩、四类观察 | 自定义任务与反馈标签 | 一个功能问题和一个体验问题修改后用同一任务复测 | 追加反馈、优先级、版本对比并生成 2.0 | `PlaytestFeedbackTool` |
| `work-publisher` / 作品发布 / 13 | 2.0 与发布内容就绪 | 完整项目和 2.0 | `publication/artifacts/tests/decisions/versions` | 封面、简介、预览、体验入口和二维码位置 | 真实发布能力待确认 | 访客可打开、理解、体验、获得结果，且无编辑入口和测试数据 | 生成发布页面并保存最终快照 | `WorkPublisherTool` |

目标 React 组件名称是实施契约，不表示本轮已经存在。当前 `TaskBuilder`、`CodePreview`、`RunTest` 等互动可以作为工具内部复用原子，但不能等同于完整工具注册机制。

## 9. 测试与验收

- 同一 `projectId` 从第 01 课持续到第 13 课。
- 课程页修改后创造台立即可见，创造台修改后课程测试读取最新修订。
- 工具不能写入注册表未声明的字段。
- 未解锁工具不能提交 patch，已解锁工具可在自由模式复用。
- 修改上游字段后，相关测试结果变为待重测，而非继续显示旧通过状态。
- 教师预览和家长查看不改变 revision、项目内容、学习进度或版本。
- 刷新后恢复项目、当前课次、工具和明确保存的输入。
- 两个标签页 revision 冲突不会静默覆盖。
- 电脑与平板布局下，顶部、左右栏、画布和底部抽屉均可操作。
- localStorage 实现与未来 API 实现通过同一 Repository 契约测试。

## 10. 待确认决策

1. 创造台正式路由，以及课程“做”环节采用嵌入、跳转还是两者兼容。
2. 输入草稿的自动保存频率、撤销/重做保留范围和版本创建触发点。
3. 第 12 课同伴身份、作品交换方式和反馈可见范围。
4. 第 13 课采用模拟发布、受控公开托管还是其他发布方式；实际链接和二维码生成方式随之确定。
5. 第一阶段是否允许一个学生创建多个 App；无论数量如何，课程主项目必须保持同一 `projectId`。
