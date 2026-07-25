# Vibe Coding 第一阶段技术架构

## 1. 文档目的

本文档基于当前仓库的实际实现，定义五角色演示平台与 13 课 JSON 课程系统的目标架构。本文档只做技术设计，不代表本轮已实现对应功能。

第一阶段继续遵守以下边界：

- 使用现有 MVP 扩展，不重建项目。
- 课程内容与 React 页面代码分离。
- 所有课次由 JSON 和 `LessonRenderer` 渲染。
- 使用模拟身份、统一模拟数据和 localStorage。
- 不接真实登录、数据库、支付、招生或真实 AI 接口。
- 先完成五端框架，再完成第 01 课和第 06 课样板；样板确认后才接入其余 11 课。

## 2. 当前 MVP 分析

### 2.1 当前已实现

当前 Git 跟踪的根目录源码实现了一条完整的学生学习最小链路：

```text
课程首页 /
  → 三节课程列表
  → /lessons/[lessonId]
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
| 页面 | `/` 学生课程首页；`/lessons/[lessonId]` 课程学习页 | 可作为学生端原型，路由需迁移 |
| 课程内容 | `content/lessons/lesson-01.json` 至 `lesson-03.json` | 结构可参考，内容与新 13 课大纲不一致 |
| 内容验证 | `lib/lesson-schema.ts` 使用 Zod 验证课次、六步和五类互动 | 可扩展，需升级为课程/单元/课次完整 Schema |
| 内容加载 | `lib/lesson-loader.ts` 显式导入三份 JSON，解析后排序 | 小规模可用，13 课前需重构清单与索引 |
| 课程渲染 | `LessonExperience` 负责六步外壳，`LessonRenderer` 按 `type` 分发 | 核心方向正确，可保留并拆分职责 |
| 互动组件 | `Reveal`、`Choice`、`TextInput`、`CodePreview`、`RunTest` | 可保留为第一批互动原子 |
| 学习进度 | 每课一个 `vibe-course-progress:{lessonId}` localStorage 项 | 可迁移，需版本、学生、课程维度和 Zod 校验 |
| 响应式 | 980、760、520 px 断点，课程页可降为单栏 | 可保留基础样式，需补平板验收 |
| 自动检查 | `npm run lint`、`npm run build`；`npm test` 串联 lint 和 build | 可保留；需补独立类型检查与自动化测试 |

当前尚未实现：

- 总部、合作伙伴、教师、家长端及五角色公共入口。
- 文档页面地图中的 `/hq`、`/partner`、`/teacher`、`/student`、`/parent` 路由。
- 5 单元、13 课的课程目录与正式课次内容。
- 第 01 课和第 06 课新大纲样板。
- 跨角色统一模拟数据。
- 校区、班级、排课、作品、教师评价、家长摘要。
- 作品保存、课程奖励、教师只读预览模式。
- 真实测试框架和课程 JSON 批量校验命令。

### 2.2 保留、重构与暂缓

| 处理方式 | 文件或能力 | 判断与影响 |
| --- | --- | --- |
| 保留 | `app/layout.tsx`、全局 Metadata、现有视觉变量与基础响应式样式 | 与目标产品无冲突，后续只扩展公共外壳 |
| 保留 | 五个 `components/interactions/*` 互动组件 | 已形成可复用原子；后续通过统一 Props 契约增强，不逐课复制 |
| 保留 | `LessonRenderer` 的判别联合分发模式 | 是 JSON 驱动的关键；新增原子时同步扩展 Schema、组件和分发表 |
| 保留 | Zod 在加载阶段解析 JSON | 构建时暴露内容错误的方向正确 |
| 保留 | localStorage 第一阶段方案 | 适合无登录、无数据库演示，但需升级键和版本 |
| 重构 | `lesson-schema.ts` | 从单个课次 Schema 升级为课程、单元、课次、学习步骤、互动原子的分层 Schema |
| 重构 | `lesson-loader.ts` | 从手工三课数组升级为课程清单、课次索引和统一查询接口 |
| 重构 | `CourseHome` | 当前硬编码“三节课”和学生首页语义；迁移为 `/student` 与 `/student/courses` 可复用模块 |
| 重构 | `/lessons/[lessonId]` | 目标路径为 `/learn/[courseId]/[lessonId]`，并增加 `mode=student/preview` 或等价只读上下文 |
| 重构 | `LessonExperience` | 目前同时负责布局、进度读写、导航和互动状态；后续拆为学习外壳、进度适配器和渲染器 |
| 重构 | `progress-storage.ts` | 增加 schemaVersion、studentId、courseId、课次状态、作品引用及 Zod 校验/迁移 |
| 重构 | 全局 CSS | 现有单文件适合 MVP，但五端扩展后按 tokens、layout、role、lesson 分层，避免继续膨胀 |
| 暂缓 | 现有三课内容批量改写 | 先只制作新第 01 课和第 06 课样板；样板确认前不处理其余 11 课 |
| 暂缓 | 真实 AI、代码沙箱、语音、发布链接和二维码 | 第一阶段明确排除或尚待产品确认 |
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
└── interactions/                    # 可复用互动原子
content/
├── courses/
│   └── vibe-coding-foundations.json # 课程与单元清单
└── lessons/
    ├── lesson-01.json
    ├── lesson-06.json
    └── ...                          # 样板确认后补齐
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
    └── index.ts
lib/
├── schemas/
│   ├── course-schema.ts
│   ├── learning-schema.ts
│   └── mock-data-schema.ts
├── content/
│   ├── course-loader.ts
│   └── lesson-index.ts
├── auth/
│   ├── demo-session.ts              # 第一阶段模拟身份
│   └── session-provider.ts          # 未来真实登录替换点
└── storage/
    ├── progress-store.ts            # 稳定接口
    ├── local-progress-store.ts      # 第一阶段实现
    └── progress-migrations.ts
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

## 5. 五个角色端的路由结构

沿用 `docs/04-page-map.md` 的 24 个页面设计：

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
│   └── /student/works
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

## 7. localStorage 学习进度

### 7.1 建议键设计

当前键 `vibe-course-progress:{lessonId}` 无学生、课程和版本维度。目标键：

```text
vibe-coding:v1:progress:{demoStudentId}:{courseId}
vibe-coding:v1:works:{demoStudentId}:{courseId}
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

### 7.2 保存规则

- 首次进入课次时创建 `not_started → in_progress` 记录。
- 每次互动提交、步骤完成和作品保存后写入；不保存仅用于展示的临时 UI 状态。
- `currentStepId` 使用稳定 ID，不使用数组下标，避免内容调整后定位错误。
- 读取和写入都经过 Zod；损坏数据回退为空状态，并保留可观测的开发警告。
- 用 `schemaVersion` 执行显式迁移；不直接假设旧数据符合新结构。
- 教师预览使用只读 `ProgressStore`，所有 `save` 为禁用状态。
- localStorage 只适合单浏览器演示，不承诺跨设备、跨浏览器或多用户同步。

### 7.3 旧键迁移

升级时提供一次性迁移函数：

1. 扫描 `vibe-course-progress:lesson-01` 等旧键。
2. 解析旧 `LessonProgress`。
3. 将 `currentStep` 映射为目标课次的 `currentStepId`。
4. 写入新的课程聚合记录。
5. 验证新记录成功后再决定是否保留旧键；第一阶段建议保留一个版本周期，避免不可恢复。

## 8. 数据库和真实登录预留

### 8.1 数据库替换点

业务组件不直接调用 localStorage。定义稳定接口：

```ts
interface ProgressStore {
  getCourseProgress(studentId: string, courseId: string): Promise<CourseProgress>;
  saveInteraction(input: SaveInteractionInput): Promise<CourseProgress>;
  completeStep(input: CompleteStepInput): Promise<CourseProgress>;
}
```

第一阶段由 `LocalProgressStore` 实现；后续新增 `ApiProgressStore`，通过 Route Handler/Server Action 调用数据库。课程 JSON 可继续作为版本化静态内容，也可在更后阶段迁移到内容服务，但两者不应和学习记录共表。

`repositories` 同样保持接口稳定：

- `OrganizationRepository`
- `ClassRepository`
- `CourseRepository`
- `LearningRepository`
- `WorkRepository`
- `FeedbackRepository`

第一阶段实现读取 `data/mock/`；数据库阶段实现读取服务端数据。

### 8.2 真实登录替换点

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

## 9. 当前技术风险

1. 现有三课内容与新 13 课大纲的课号语义冲突，不能直接把旧 `lesson-02/03` 当作新大纲第 02/03 课。
2. 当前 `Choice` 的错误提示硬编码为 HTML 语境，证明互动组件还未完全内容化。
3. `RunTest` 只是字符串包含检查，不执行代码；名称和界面应持续明确为“安全规则检查”，不能宣称真实代码测试。
4. 当前进度完成度固定按 6 步计算，尚不能表达选做项、作品完成或测试次数。
5. 当前课程加载器手工导入文件，新增 13 课时容易漏注册。
6. 当前无自动化组件/E2E 测试，响应式仅有 CSS 断点，尚未在目标平板尺寸验收。
7. 模拟 AI 的交互方式、跨角色数据联动、作品发布方式等仍未确认，不能在架构设计中擅自实现。

