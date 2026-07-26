# Vibe Coding 完整演示版数据模型

## 1. 文档目的

本文档定义五角色演示平台共享的数据实体、贯穿 13 课的 `ProjectDocument`、第一阶段本地/模拟数据读取方式，以及未来迁移数据库的边界。课程教学内容仍由 JSON 管理；学生 App 不存入课程 JSON，而通过项目数据域持续保存。

## 2. 数据域划分

```text
内容域
Course ─ Unit ─ Lesson

组织域
Headquarters ─ Partner ─ Campus ─ Class
                         ├─ Teacher
                         └─ Student

关系域
Parent ─ ParentStudent ─ Student
Teacher ─ TeachingAssignment ─ Class/Course
Class ─ Enrollment ─ Student

学习域
Student ─ LessonProgress ─ Lesson
Student ─ ProjectDocument ─ Course
ProjectDocument ─ Version/Test/Artifact/Decision/Feedback/Publication
Teacher ─ TeacherFeedback ─ StudentWork/Student/Lesson
```

第一阶段的“总部”是角色和组织视角，不建议创建只有一行的特殊业务表；可用 `Organization(type="headquarters")` 表达。合作伙伴同样用 Organization 表达，避免未来增加区域机构时重建模型。

## 3. 核心实体

### 3.1 Organization

统一表达总部与合作伙伴：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定唯一 ID |
| `type` | `headquarters/partner` | 组织类型 |
| `name` | string | 组织名称 |
| `status` | `active/inactive` | 演示状态 |
| `parentOrganizationId` | string/null | 合作伙伴可指向总部 |

### 3.2 User 与角色档案

| 实体 | 关键字段 | 说明 |
| --- | --- | --- |
| `User` | `id, displayName, role, avatar, status` | 五种身份统一入口 |
| `HeadquartersProfile` | `userId, organizationId` | 总部人员范围 |
| `PartnerProfile` | `userId, organizationId` | 合作伙伴所属组织 |
| `TeacherProfile` | `userId, organizationId, campusIds` | 教师档案 |
| `StudentProfile` | `userId, studentNo, grade` | 学生档案 |
| `ParentProfile` | `userId` | 家长档案 |
| `ParentStudent` | `parentId, studentId, relationship` | 家长与孩子多对多关系 |

第一阶段 `User` 只服务于演示身份，不包含密码、手机号验证、OAuth 账号或登录凭证。

### 3.3 Campus

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 校区 ID |
| `partnerOrganizationId` | string | 所属合作伙伴 |
| `name` | string | 校区名称 |
| `city` | string | 城市 |
| `status` | `active/inactive` | 状态 |

### 3.4 Class

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 班级 ID |
| `campusId` | string | 所属校区 |
| `name` | string | 班级名 |
| `courseId` | string | 当前课程 |
| `term` | string | 演示学期 |
| `status` | `planned/active/completed` | 班级状态 |

### 3.5 Enrollment、TeachingAssignment 与 Schedule

| 实体 | 关键字段 | 用途 |
| --- | --- | --- |
| `Enrollment` | `id, classId, studentId, enrolledAt, status` | 学生加入班级 |
| `TeachingAssignment` | `id, classId, teacherId, courseId, role` | 教师负责班级/课程 |
| `Schedule` | `id, classId, teacherId, lessonId, startsAt, endsAt, room` | 合作伙伴排课视图 |

不把 `teacherId` 或学生数组直接塞进 Class，避免一名教师多班、学生换班时难以维护。

### 3.6 Course、Unit、Lesson

课程内容实体来自 `docs/07-course-schema.md` 的静态 JSON：

- `Course`：课程元数据、5 个单元、13 课索引。
- `Unit`：单元与课次关系。
- `Lesson`：六步、教师说明、学生内容、家长摘要和互动原子。

模拟业务数据只保存这些实体的 ID，不复制课程标题、课次目标或课程正文。展示时通过 CourseRepository 关联，避免课程改名后五端数据不一致。

### 3.7 LessonProgress

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 未来数据库主键；本地可派生 |
| `studentId` | string | 学生 |
| `courseId` | string | 课程 |
| `lessonId` | string | 课次 |
| `status` | `not_started/in_progress/completed` | 课次状态 |
| `currentStepId` | string/null | 当前步骤 |
| `completedStepIds` | string[] | 已完成步骤 |
| `interactions` | record | 第一阶段本地互动结果 |
| `testAttempts` | number | 测试次数 |
| `startedAt/updatedAt/completedAt` | ISO datetime/null | 时间 |

数据库阶段可把互动结果拆为 `InteractionAttempt`，但第一阶段不提前拆表。

### 3.8 StudentWork

`StudentWork` 不再作为课程主作品的第二份正文。目标架构以 `ProjectDocument` 为事实源，`StudentWork` 仅作为兼容的作品列表/发布投影；迁移完成后可改名为 `ProjectSummary` 或由 query 动态生成。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 作品 ID |
| `studentId` | string | 作者 |
| `courseId` | string | 所属课程 |
| `lessonId` | string | 最近关联课次 |
| `title` | string | 作品名 |
| `description` | string | 作品说明 |
| `content` | object | 第一阶段可保存受控 HTML/CSS/JS 文本或结构化产出 |
| `thumbnail` | string/null | 模拟缩略图路径 |
| `status` | `draft/completed/published_demo` | 第一阶段发布只可为演示状态 |
| `version` | number | 简单版本号 |
| `createdAt/updatedAt` | ISO datetime | 时间 |

课程主项目跨课复用已经确认；`StudentWork` 兼容记录必须引用该项目或其版本，不能形成另一份正文。是否生成真实公开链接仍是 TODO。

### 3.9 ProjectDocument

每名学生在第 01 课创建课程主项目，第 02—13 课持续修改同一个 `projectId`。完整结构见 `creative-workbench-spec.md`，至少包含：

| 字段组 | 内容 |
| --- | --- |
| 身份与版本 | `schemaVersion/revision/projectId/studentId/courseId/createdAt/updatedAt` |
| 意图与边界 | `title/audience/scenario/intent/scope` |
| 页面与设计 | `pages/structure/styles/components` |
| 功能逻辑 | `interactions/inputs/conditions/state` |
| 验证与证据 | `tests/artifacts/decisions/feedback/versions` |
| 发布 | `publication` |

数据规则：

- 项目正文不复制进 `LessonProgress.interactions`；学习进度只保留课程完成位置和必要互动结果。
- 所有嵌套实体使用稳定 ID，页面/组件顺序变化不能破坏引用。
- `revision` 每次成功 patch 增加，用于同步、测试有效性和乐观锁。
- 测试记录关联被测 revision；上游修改后，旧通过结果保留为历史证据但不计入当前完成。
- 版本是明确快照，不能只存一个可变的 `version` 数字。
- 发布必须引用一个确认版本，不能直接发布未保存草稿。

### 3.10 ProjectPatch 与工具权限

所有项目修改使用统一命令：

| 字段 | 说明 |
| --- | --- |
| `projectId` | 修改目标 |
| `baseRevision` | 客户端读取时的项目修订 |
| `source` | `lesson/workbench/migration` |
| `lessonId/toolId` | 课程与工具来源 |
| `changes` | 受控字段路径和新值 |
| `decision` | 可选的学生选择理由 |
| `createdAt` | 提交时间 |

Repository 必须校验项目归属、只读角色、base revision、工具注册的输出字段和 ProjectDocument Schema。React 组件不得直接写 localStorage。

### 3.11 TeacherFeedback

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 反馈 ID |
| `teacherId` | string | 教师 |
| `studentId` | string | 学生 |
| `workId` | string/null | 可选关联作品 |
| `lessonId` | string/null | 可选关联课次 |
| `summary` | string | 面向学生/家长的简短评价 |
| `visibility` | `teacher_only/student_and_parent` | 展示范围 |
| `isDemo` | boolean | 第一阶段固定 true |
| `createdAt/updatedAt` | ISO datetime | 时间 |

教师评价究竟关联作品、课次还是学生阶段表现尚未确认，因此模型允许三种关联，但实现阶段必须根据产品确认收窄页面行为。

## 4. 主要关系

| 关系 | 基数 |
| --- | --- |
| 总部 Organization → 合作伙伴 Organization | 1:N |
| 合作伙伴 Organization → Campus | 1:N |
| Campus → Class | 1:N |
| Class ↔ Teacher | N:M，通过 TeachingAssignment |
| Class ↔ Student | N:M，通过 Enrollment |
| Parent ↔ Student | N:M，通过 ParentStudent |
| Course → Unit → Lesson | 1:N:N |
| Student ↔ Lesson | N:M，通过 LessonProgress |
| Student → StudentWork | 1:N |
| Student → ProjectDocument | 1:N；课程主线当前指定其中 1 个持续项目 |
| ProjectDocument → Version/Test/Artifact/Decision/Feedback | 1:N |
| ProjectDocument → Publication | 1:0..1 当前发布状态 |
| Teacher → TeacherFeedback | 1:N |
| StudentWork → TeacherFeedback | 1:N，可选 |

## 5. 五端读取范围

所有端读取同一组实体，只是 query 范围不同：

| 角色 | 起点 | 过滤范围 | 典型查询 |
| --- | --- | --- | --- |
| 总部 | 总部组织 | 全部合作伙伴与校区 | 全局数量、课程完成率、作品数 |
| 合作伙伴 | 当前 partner organization | 所属 Campus | 校区、班级、教师、排课和课程进度 |
| 教师 | 当前 teacher | TeachingAssignment 所属班级 | 自己班级、学生进度、项目安全视图、测试、版本和反馈 |
| 学生 | 当前 student | 自己的 Enrollment/Progress/Project | 课程地图、进度、完整项目和创造工具 |
| 家长 | 当前 parent | ParentStudent 关联孩子 | 孩子进度、项目摘要、阶段成果、公开版本和可见反馈 |

组件不自行按角色过滤。Repository/query 必须接收 `SessionContext` 并返回已经限定范围的 view model。

## 6. 第一阶段统一模拟数据

### 6.1 单一数据源

建议把模拟数据按实体拆文件，但从一个入口导出：

```ts
export const mockDatabase = mockDatabaseSchema.parse({
  organizations,
  campuses,
  users,
  classes,
  enrollments,
  teachingAssignments,
  schedules,
  progress,
  works,
  projects,
  feedback,
});
```

页面禁止各自声明“3 个校区”“12 名学生”等重复常量。总部汇总、合作伙伴校区、教师班级、学生本人和家长孩子必须通过同一组 ID 关系得到一致结果。

### 6.2 Repository 层

示例接口：

```ts
interface LearningRepository {
  getStudentDashboard(studentId: string): Promise<StudentDashboard>;
  getTeacherClassProgress(teacherId: string): Promise<TeacherClassProgress[]>;
  getParentOverview(parentId: string): Promise<ParentOverview>;
  getHeadquartersAnalytics(): Promise<HeadquartersAnalytics>;
}
```

第一阶段实现可同步读取内存数据，但接口返回 Promise，使后续数据库实现不改页面调用方式。

### 6.3 静态模拟数据与本地变更

需要区分：

- 基线模拟数据：校区、用户、班级、排课、已有示例作品和已有教师评价，来自 `data/mock/`。
- 当前浏览器产生的数据：学生学习进度和 `ProjectDocument`，来自 localStorage。

建议由 `DemoLearningRepository` 合并两层：

```text
mock baseline
    + local progress/project overrides
    = current demo view model
```

同一浏览器内的学生、教师和家长端必须读取同一项目事实的不同角色投影。教师预览和家长视图只读；不再为三个页面维护冲突的作品副本。跨设备仍不在 localStorage 保证范围内。

## 7. 数据一致性规则

- 所有外键 ID 必须在 mock 数据加载时通过 Zod `superRefine` 校验存在。
- 汇总数由明细计算，不手写一份“总部学生数”。
- 课程完成率使用统一公式和统一分母；未开始课程是否计入分母需在实现前确定。
- 学生进度不得由教师预览写入。
- 学生项目不得由教师课程预览或家长视图写入；教师反馈使用独立授权命令。
- 课程主项目在 13 课中保持同一 `projectId`。
- 项目 patch 只能修改工具注册表声明的字段。
- 当前测试完成度只计算关联最新有效 revision 的通过结果。
- 家长只能看到 `visibility=student_and_parent` 的反馈。
- 合作伙伴查询必须限定其 `partnerOrganizationId` 对应校区。
- 课次标题、单元、关键概念从课程 JSON 读取，不复制到业务 mock 数据。
- 日期统一保存 ISO 8601 UTC 字符串，展示层再按本地时区格式化。

## 8. 迁移到数据库

### 8.1 推荐迁移顺序

1. 冻结并版本化当前 Zod 业务模型。
2. 为 Organization、User、Campus、Class、关系表、Progress、Project、ProjectVersion、ProjectTest、ProjectFeedback、Publication 建数据库表或等价存储。
3. 用 seed 脚本导入同一份模拟数据，保持原 ID 不变。
4. 实现数据库 Repository，与 mock Repository 通过同一套契约测试。
5. 将服务端页面/query 切换到数据库 Repository。
6. 增加真实 SessionProvider 和服务端授权；项目 patch 在服务端校验归属、字段权限和 revision。
7. 如需保留浏览器学习记录，登录后提供显式导入/合并流程；不得静默覆盖云端数据。

### 8.2 表设计原则

- 组织、用户、班级等规范化为关系表。
- 课程 JSON 保持版本化静态内容，业务表通过 `courseId/lessonId/contentVersion` 引用。
- 高频汇总先实时查询；有性能证据后再引入物化汇总，不提前缓存。
- `LessonProgress` 可保存步骤级聚合，互动尝试量增长后再拆 `InteractionAttempt`。
- ProjectDocument 的结构化正文可用 JSON 列或规范化子表；代码、截图等大产物使用对象存储引用。以 Repository 契约屏蔽存储选择。
- 所有多租户查询在服务端基于 session scope 授权，不能依赖前端隐藏菜单。

### 8.3 localStorage 数据迁移

真实登录上线时需要明确三种情况：

1. 云端无记录、本地有记录：允许用户确认后导入。
2. 云端有记录、本地无记录：读取云端。
3. 两边都有记录：按 `updatedAt` 不能自动证明业务上应该覆盖，需提供合并规则或用户选择。

第一阶段只需让本地结构包含 `schemaVersion` 和稳定 ID，为未来迁移保留可能性。

## 9. 待确认的数据问题

1. 第一阶段是否允许学生建立多个非课程主项目；课程 13 课的主项目保持唯一已确认。
2. 教师新增模拟评价是否立即出现在家长端，以及评价主要关联项目、版本、课次还是阶段表现。
3. 合作伙伴演示身份默认对应哪个校区或合作伙伴组织。
4. 项目版本在 localStorage 中达到何种容量后拆键或迁移 IndexedDB。
5. 第 09 课 App 运行时状态刷新后的默认策略。
6. 第 13 课“发布”是模拟状态、受控公开访问还是其他方式。
