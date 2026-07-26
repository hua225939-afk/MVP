# Vibe Coding 完整演示版技术架构

## 1. 文档目的

本文档基于当前仓库的实际实现，定义五角色演示平台、13 课 JSON 课程系统与“造物星球·创造台”的目标架构。本文档只做技术设计，不代表本轮已实现对应功能。

第一阶段继续遵守以下边界：

- 使用现有 MVP 扩展，不重建项目。
- 课程内容与 React 页面代码分离。
- 所有课次由 JSON 和 `LessonRenderer` 渲染。
- 课程页和创造台通过同一 `ProjectRepository` 读写同一份 `ProjectDocument`，创造台不是第二套系统。
- 第 01 课创建课程主项目，第 02—13 课持续修改同一个 `projectId`。
- 使用模拟身份、统一模拟数据和 localStorage，并保留数据库迁移边界。
- 不接真实登录、数据库、支付、招生或真实 AI 接口。
- 当前五端框架和第 01、06 课样板已经完成；后续先建设创造台正式底层架构，再按课次分组接入工具。

## 2. 当前 MVP 分析

### 2.1 当前已实现

当前源码已经实现五角色框架和第 01、06 课样板学生学习链路：

```text
公共入口与五角色端
  → /student/courses
  → /learn/[courseId]/[lessonId]
  → JSON 课程读取
  → Zod 构建时验证
  → 六步课程体验
  → LessonRenderer 分发互动组件
  → localStorage 保存课次进度
```

已实现内容如下：

| 能力 | 当前实现 | 结论 |
| --- | --- | --- |
| 技术栈 | Next.js App Router、React、TypeScript、Tailwind CSS、Zod，使用 vinext/Vite 和 Cloudflare Worker 构建部署 | 可保留 |
| 页面 | 五角色入口与仪表盘；学生课程页；新旧课次路由 | 五端框架已完成，创造台正式页面待建设 |
| 课程内容 | `lesson-01.json`、`lesson-06.json` 两节完整样板和 13 课课程清单 | 样板已完成，其余课次待按工具分组接入 |
| 内容验证 | `lib/lesson-schema.ts` 已验证 Course、Lesson、六步和六类互动 | 需增加项目绑定和工具引用验证 |
| 内容加载 | `import.meta.glob` 自动发现课次并校验课程/单元引用 | 可保留并增加全课程完成性策略 |
| 课程渲染 | `LessonExperience` 负责六步外壳，`LessonRenderer` 按 `type` 分发 | 核心方向正确，可保留并拆分职责 |
| 互动组件 | `Reveal`、`Choice`、`TextInput`、`CodePreview`、`RunTest`、`TaskBuilder` | 可作为课程与工具内部复用原子 |
| 学习进度 | 已使用 `vibe-coding:v1:progress:{studentId}:{courseId}` 聚合键并兼容旧键 | 保留；项目文档必须使用独立 Store |
| 响应式 | 980、760、520 px 断点，课程页可降为单栏 | 可保留基础样式，需补平板验收 |
| 自动检查 | `npm run lint`、`npm run build`；`npm test` 串联 lint 和 build | 可保留；需补独立类型检查与自动化测试 |

当前尚未实现的本轮目标：

- 创造台顶部导航、插件中心、创造画布、创造助手和底部抽屉。
- 统一 `ProjectDocument`、`ProjectRepository`、patch、版本、项目测试与迁移。
- 13 个课程工具的统一注册、解锁、基础/自由模式和字段权限。
- 第 02—05、07—13 课正式 JSON 与对应工具。
- 学生本地项目在教师、家长等角色端的统一只读投影。
- 作品发布方式、正式测试框架和全课程 E2E。

### 2.2 保留、重构与暂缓

| 处理方式 | 文件或能力 | 判断与影响 |
| --- | --- | --- |
| 保留 | `app/layout.tsx`、全局 Metadata、现有视觉变量与基础响应式样式 | 与目标产品无冲突，后续只扩展公共外壳 |
| 保留 | 五个 `components/interactions/*` 互动组件 | 已形成可复用原子；后续通过统一 Props 契约增强，不逐课复制 |
| 保留 | `LessonRenderer` 的判别联合分发模式 | 是 JSON 驱动的关键；新增原子时同步扩展 Schema、组件和分发表 |
| 保留 | Zod 在加载阶段解析 JSON | 构建时暴露内容错误的方向正确 |
| 保留 | localStorage 第一阶段方案 | 适合无登录、无数据库演示，但需升级键和版本 |
| 重构 | `lesson-schema.ts` | 从单个课次 Schema 升级为课程、单元、课次、学习步骤、互动原子的分层 Schema |
| 保留并增强 | `lesson-loader.ts` | 已用 glob 自动发现并校验课次；补项目绑定、工具引用和 13 课完整性校验 |
| 重构 | `CourseHome` | 当前硬编码“三节课”和学生首页语义；迁移为 `/student` 与 `/student/courses` 可复用模块 |
| 重构 | `/lessons/[lessonId]` | 目标路径为 `/learn/[courseId]/[lessonId]`，并增加 `mode=student/preview` 或等价只读上下文 |
| 重构 | `LessonExperience` | 目前同时负责布局、进度读写、导航和互动状态；后续拆为学习外壳、进度适配器和渲染器 |
| 重构 | `progress-storage.ts` | 增加 schemaVersion、studentId、courseId、课次状态、作品引用及 Zod 校验/迁移 |
| 重构 | 全局 CSS | 现有单文件适合 MVP，但五端扩展后按 tokens、layout、role、lesson 分层，避免继续膨胀 |
| 保留 | 第 01、06 课样板及现有六种互动 | 作为创造台工具宿主与课程绑定迁移的回归基线 |
| 暂缓 | 真实 AI、任意代码沙箱、正式语音 | 保持预设助手和安全规则检查边界 |
| 待确认 | 真实发布链接和二维码 | 工具与数据字段先按最终架构设计，实现方式确认后接入 |
| 暂缓 | 数据库、真实登录、复杂权限、支付 | 只保留接口位置，不实现基础设施 |

仓库根目录还有未跟踪的 `vibe-coding-course-mvp.zip` 和未跟踪的同名嵌套目录。嵌套目录中的主要源码与根目录副本相同，应视为交付/复制产物；后续开发以 Git 跟踪的根目录源码为唯一来源，避免双份修改。

## 3. 当前项目结构

```text
app/
├── layout.tsx
├── page.tsx                         # 当前学生课程首页
├── globals.css
└── lessons/[lessonId]/page.tsx      # 当前课次页
components/
├── course/CourseHome.tsx
├── lesson/
│   ├── LessonExperience.tsx
│   └── LessonRenderer.tsx
└── interactions/
    ├── Choice.tsx
    ├── CodePreview.tsx
    ├── Reveal.tsx
    ├── RunTest.tsx
    └── TextInput.tsx
content/lessons/
├── lesson-01.json
├── lesson-02.json
└── lesson-03.json
lib/
├── lesson-loader.ts
├── lesson-schema.ts
└── progress-storage.ts
worker/                              # Cloudflare Worker 入口
build/                               # Sites 构建辅助
docs/                                # 产品、课程与技术文档
```

## 4. 目标项目结构

目标结构按“路由、领域数据、课程内容、渲染组件、存储适配器”分层。目录名为设计建议，实施阶段可在不破坏职责边界的前提下微调。

```text
app/
├── page.tsx                         # 公共身份入口
├── hq/
├── partner/
├── teacher/
├── student/
│   ├── workbench/[projectId]/       # 持续创造台
│   ├── works/
│   └── courses/
├── parent/
└── learn/[courseId]/[lessonId]/
components/
├── app-shell/                       # 五端共用导航、演示标识、布局
├── dashboards/                      # 只接收 view model 的展示组件
├── course/                          # 课程地图、单元、课次卡片
├── lesson/
│   ├── LessonExperience.tsx
│   ├── LessonRenderer.tsx
│   ├── LessonStepNav.tsx
│   └── TeacherPreviewBoundary.tsx
├── interactions/                    # 可复用互动原子
└── workbench/
    ├── WorkbenchShell.tsx
    ├── ProjectCanvas.tsx
    ├── CreativeAssistant.tsx
    ├── WorkbenchDrawer.tsx
    └── tools/                       # 注册工具组件，不按课复制页面
content/
├── courses/
│   └── vibe-coding-foundations.json # 课程与单元清单
└── lessons/
    ├── lesson-01.json
    ├── lesson-06.json
    └── ...                          # 按工具分组补齐其余课次
data/
├── mock/
│   ├── organizations.ts
│   ├── users.ts
│   ├── classes.ts
│   ├── schedules.ts
│   ├── progress.ts
│   ├── works.ts
│   └── feedback.ts
└── repositories/                   # 页面唯一数据入口
    ├── organization-repository.ts
    ├── learning-repository.ts
    ├── project-repository.ts
    └── index.ts
lib/
├── schemas/
│   ├── course-schema.ts
│   ├── learning-schema.ts
│   └── mock-data-schema.ts
├── content/
│   ├── course-loader.ts
│   └── lesson-index.ts
├── projects/
│   ├── project-document-schema.ts
│   ├── project-patch-schema.ts
│   ├── project-migrations.ts
│   └── project-projections.ts
├── tools/
│   ├── course-tool-registry.ts
│   └── course-tool-schema.ts
├── auth/
│   ├── demo-session.ts              # 第一阶段模拟身份
│   └── session-provider.ts          # 未来真实登录替换点
└── storage/
    ├── progress-store.ts            # 稳定接口
    ├── local-progress-store.ts      # 第一阶段实现
    ├── progress-migrations.ts
    ├── project-store.ts
    └── local-project-store.ts
tests/
├── unit/
├── integration/
└── e2e/
```

边界规则：

- `content/` 只存课程定义，不存用户进度或运营数据。
- `data/mock/` 是五端共享的模拟业务数据源，不在页面组件内重复造数据。
- 页面只调用 `repositories` 或面向页面的 query 函数，不直接导入多份 mock 文件拼接。
- `LessonRenderer` 只解释课程 JSON，不读取角色、localStorage 或数据库。
- 存储由 `progress-store` 接口隔离；从 localStorage 迁移数据库时不改互动组件。
- `ProjectRepository` 是课程页、创造台和角色投影访问学生 App 的唯一入口。
- 课程互动需要改项目时调用注册工具宿主并提交 `ProjectPatch`，不得直接写 localStorage。
- `ProjectDocument` 与学习进度分开保存：前者描述 App，后者描述课程完成位置。
- 工具注册表负责组件分发、字段权限和测试规则；`LessonRenderer` 不增加按课次判断。

## 5. 五个角色端的路由结构

沿用现有五端页面，并新增学生创造台正式路由（最终路径待确认）：

```text
/
├── /hq
│   ├── /hq/courses
│   ├── /hq/components
│   ├── /hq/campuses
│   └── /hq/analytics
├── /partner
│   ├── /partner/campuses
│   ├── /partner/classes
│   ├── /partner/teachers
│   └── /partner/schedule
├── /teacher
│   ├── /teacher/classes
│   ├── /teacher/courses
│   ├── /teacher/students
│   └── /teacher/works
├── /student
│   ├── /student/courses
│   ├── /student/works
│   └── /student/workbench/[projectId]
├── /parent
│   ├── /parent/progress
│   ├── /parent/works
│   └── /parent/feedback
└── /learn/[courseId]/[lessonId]
```

路由约束：

- `/` 只做演示身份选择，不做真实认证。
- 五端各有独立 layout，复用统一 `RoleShell`，并明确显示“演示身份/模拟数据”。
- 第一阶段通过固定 demo session 确定角色和数据范围，不依赖 URL 伪装真实权限。
- 学生从 `/student/courses` 进入学习页，允许写入本地进度。
- 学生从课程“做”环节或顶部“创造台”进入同一 `/student/workbench/[projectId]`；嵌入与跳转策略待确认，但两种入口必须共用同一项目。
- 教师从 `/teacher/courses` 进入同一学习页时必须是只读预览，不得写入学生进度。预览模式的具体 URL 表达仍需确认。
- 业务范围过滤在 repository/query 层完成：总部全局、合作伙伴单校区、教师本人班级、学生本人、家长关联孩子。

## 6. 课程数据与渲染数据流

```text
课程清单 JSON + 课次 JSON
          │
          ▼
Zod parse（构建/加载时失败）
          │
          ▼
CourseLoader / LessonLoader
          │
          ├── 课程地图、教师预览、总部课程结构
          │
          ▼
LessonExperience（六步导航与页面外壳）
          │
          ▼
LessonRenderer（按 atom.type 判别分发）
          │
          ├── Reveal
          ├── Choice
          ├── TextInput
          ├── CodePreview
          └── RunTest
          │
          ▼
互动结果 InteractionResult
          │
          ▼
ProgressStore.save(...)
          │
          ├── 第一阶段：localStorage
          └── 后续：数据库 API
```

职责约束：

1. JSON 描述“教什么、显示什么、完成条件是什么”。
2. `LessonRenderer` 描述“某种互动类型使用哪个 React 组件”。
3. 互动组件描述“如何操作并产生标准结果”，不得知道它属于第几课。
4. `LessonExperience` 汇总互动完成状态并控制步骤导航。
5. `ProgressStore` 负责持久化，不参与内容渲染。
6. 所有互动原子统一输出 `{ value, completed, correct?, attempts?, updatedAt }` 形态；特有值由 Schema 判别。

## 7. 创造台与持续项目数据流

```text
Lesson JSON ── toolId + projectBinding ─┐
                                       ▼
LessonRenderer ── CourseToolHost ── CourseToolRegistry ── React Tool
                                       │
Workbench ─────────────────────────────┘
                                       │ ProjectPatch
                                       ▼
                               ProjectRepository
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
              LocalProjectRepository       ApiProjectRepository
                  （当前阶段）                （数据库阶段）
                         │
                         ▼
                  ProjectDocument
```

架构不变量：

1. 课程页和创造台用同一个 `projectId`、同一个 Repository 和同一工具注册表。
2. `LessonRenderer` 仍只负责 JSON 原子分发；项目上下文由 `CourseToolHost` 注入。
3. 工具读取注册表声明的 `input` 字段，只能修改声明的 `output` 字段。
4. 所有修改提交 `ProjectPatch`，包含 `baseRevision/source/lessonId/toolId/changes`；Repository 校验后原子写入并递增 revision。
5. 工具修改上游字段时，引用旧 revision 的测试结果变为待重测。
6. 教师预览使用只读 Repository；家长和运营角色只读取安全投影。
7. `ProjectDocument` 的完整结构、课次字段矩阵和 localStorage 键见 `creative-workbench-spec.md`。

## 8. localStorage 学习进度与项目

### 8.1 建议键设计

当前键 `vibe-course-progress:{lessonId}` 无学生、课程和版本维度。目标键：

```text
vibe-coding:v1:progress:{demoStudentId}:{courseId}
vibe-coding:v1:works:{demoStudentId}:{courseId}
vibe-coding:v1:project-index:{demoStudentId}:{courseId}
vibe-coding:v1:project:{demoStudentId}:{projectId}
vibe-coding:v1:session
```

每门课程使用一个聚合记录，便于课程地图一次读取；记录内部按 `lessonId` 存储：

```json
{
  "schemaVersion": 1,
  "studentId": "student-demo-01",
  "courseId": "vibe-coding-foundations",
  "lessons": {
    "lesson-01": {
      "status": "in_progress",
      "currentStepId": "make",
      "completedStepIds": ["look", "explain", "think"],
      "interactions": {
        "lesson-01.make.card-preview": {
          "value": true,
          "completed": true,
          "correct": true,
          "attempts": 1,
          "updatedAt": "2026-07-25T08:00:00.000Z"
        }
      },
      "startedAt": "2026-07-25T07:30:00.000Z",
      "updatedAt": "2026-07-25T08:00:00.000Z",
      "completedAt": null
    }
  }
}
```

项目键与进度键不得合并：清理或迁移学习导航状态不能导致学生 App 丢失。旧 `works` 在项目架构落地时迁移为 `ProjectDocument.artifacts/publication` 的安全投影，迁移成功前保留兼容读取。

### 8.2 保存规则

- 首次进入课次时创建 `not_started → in_progress` 记录。
- 每次互动提交、步骤完成和作品保存后写入；不保存仅用于展示的临时 UI 状态。
- `currentStepId` 使用稳定 ID，不使用数组下标，避免内容调整后定位错误。
- 读取和写入都经过 Zod；损坏数据回退为空状态，并保留可观测的开发警告。
- 用 `schemaVersion` 执行显式迁移；不直接假设旧数据符合新结构。
- 教师预览使用只读 `ProgressStore`，所有 `save` 为禁用状态。
- localStorage 只适合单浏览器演示，不承诺跨设备、跨浏览器或多用户同步。
- 项目写入还需校验 revision 和工具字段权限；同标签页用 Store 订阅，不同标签页用 `storage` 事件同步。

### 8.3 旧键迁移

升级时提供一次性迁移函数：

1. 扫描 `vibe-course-progress:lesson-01` 等旧键。
2. 解析旧 `LessonProgress`。
3. 将 `currentStep` 映射为目标课次的 `currentStepId`。
4. 写入新的课程聚合记录。
5. 验证新记录成功后再决定是否保留旧键；第一阶段建议保留一个版本周期，避免不可恢复。

## 9. 数据库和真实登录预留

### 9.1 数据库替换点

业务组件不直接调用 localStorage。定义稳定接口：

```ts
interface ProgressStore {
  getCourseProgress(studentId: string, courseId: string): Promise<CourseProgress>;
  saveInteraction(input: SaveInteractionInput): Promise<CourseProgress>;
  completeStep(input: CompleteStepInput): Promise<CourseProgress>;
}
```

第一阶段由 `LocalProgressStore` 实现；后续新增 `ApiProgressStore`，通过 Route Handler/Server Action 调用数据库。课程 JSON 可继续作为版本化静态内容，也可在更后阶段迁移到内容服务，但两者不应和学习记录共表。

持续项目使用并行的稳定接口：

```ts
interface ProjectRepository {
  getProject(actor: SessionContext, projectId: string): Promise<ProjectDocument>;
  applyPatch(actor: SessionContext, patch: ProjectPatch): Promise<ProjectDocument>;
  getProjection(actor: SessionContext, projectId: string): Promise<ProjectProjection>;
}
```

数据库阶段新增 `ApiProjectRepository`，服务端校验角色、项目归属、base revision、字段权限和 Schema。代码、截图等大产物可迁移到对象存储，但 `artifacts` 保持稳定引用。

`repositories` 同样保持接口稳定：

- `OrganizationRepository`
- `ClassRepository`
- `CourseRepository`
- `LearningRepository`
- `WorkRepository`
- `FeedbackRepository`

第一阶段实现读取 `data/mock/`；数据库阶段实现读取服务端数据。

### 9.2 真实登录替换点

第一阶段 `DemoSessionProvider` 返回固定演示身份：

```ts
type SessionContext = {
  actorId: string;
  role: "hq" | "partner" | "teacher" | "student" | "parent";
  organizationId?: string;
  campusIds: string[];
  studentIds: string[];
  isDemo: true;
};
```

后续真实登录只替换 `SessionProvider` 和服务端授权策略，页面继续消费相同的 `SessionContext`。重要原则是：

- 演示阶段的前端角色过滤不是安全边界。
- 数据库阶段必须在服务端按 session 再做授权与范围过滤。
- 不提前引入账号表、密码、OAuth 或权限后台。

## 9.3 五端动态联动实现

第一阶段使用一套固定演示关系：一名学生、一名教师、一名关联家长、
一个班级、一个合作伙伴校区和一个总部身份。组织与身份关系由
`DemoIdentityRepository` 提供；学生项目继续只由 `ProjectRepository`
提供，课程进度由 `LearningProgressRepository` 提供。

`RoleDashboardService` 是五个角色页面的统一查询入口：

```text
DemoIdentityRepository
        + LearningProgressRepository
        + ProjectRepository
        + Course / Lesson / Tool registries
        + PlatformRepository（教师评语与关注标记）
        = 五角色 view model
```

- 学生端读取完整的本人进度与项目，并读取对学生可见的教师评语。
- 教师端只读取演示班级学生的进度、项目、测试、Bug、反馈和版本；评语
  写入 `PlatformRepository`，不修改 `ProjectDocument.revision`。
- 家长端只读取关联学生的非技术摘要、行为证据、版本与可见评语。
- 合作伙伴端只读取演示校区汇总。
- 总部端读取平台汇总、课程 JSON、互动组件注册表和课程工具注册表。

所有浏览器数据均带 `schemaVersion` 并经 Zod 校验。损坏记录安全回退，
旧进度和旧项目在迁移成功前保留原键或备份。此联动只在当前浏览器有效，
不表示真实账号、跨设备同步或正式权限控制。

## 10. 当前技术风险

1. 当前第 01、06 课的 `TaskBuilder` 把“创造台”表现为课内原子，尚未接统一 ProjectDocument；迁移必须保留已保存进度并把产出映射到项目字段。
2. 当前互动结果存放在学习进度中，不能承担 13 课持续项目；若直接扩展会把课程导航与作品版本耦合。
3. `RunTest` 只是字符串包含检查，不执行代码；名称和界面应持续明确为安全规则检查。
4. 当前进度完成度固定按 6 步计算，尚不能完整表达工具解锁、项目里程碑和发布准备度。
5. 项目版本可能使 localStorage 增长；需先测量容量，再决定是否拆分版本或迁移 IndexedDB，不能预先引入复杂存储。
6. 当前无完整自动化组件/E2E 测试，创造台多栏布局还需电脑和平板验收。
7. 第 09 课运行时状态刷新策略、第 12 课正式概念、第 13 课发布方式仍待确认。
