# Vibe Coding 第一阶段数据模型

## 1. 文档目的

本文档定义五角色演示平台共享的数据实体、关系、第一阶段模拟数据读取方式，以及未来迁移数据库的边界。课程教学内容仍由 JSON 管理，本文档主要描述组织、用户、学习记录、作品和反馈等业务数据。

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
Student ─ StudentWork ─ Lesson/Course
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

是否允许跨课复用作品、是否生成公开链接仍是 TODO。确认前只设计字段，不实现真实发布。

### 3.9 TeacherFeedback

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
| Teacher → TeacherFeedback | 1:N |
| StudentWork → TeacherFeedback | 1:N，可选 |

## 5. 五端读取范围

所有端读取同一组实体，只是 query 范围不同：

| 角色 | 起点 | 过滤范围 | 典型查询 |
| --- | --- | --- | --- |
| 总部 | 总部组织 | 全部合作伙伴与校区 | 全局数量、课程完成率、作品数 |
| 合作伙伴 | 当前 partner organization | 所属 Campus | 校区、班级、教师、排课和课程进度 |
| 教师 | 当前 teacher | TeachingAssignment 所属班级 | 自己班级、学生进度、作品和反馈 |
| 学生 | 当前 student | 自己的 Enrollment/Progress/Work | 课程地图、进度、作品 |
| 家长 | 当前 parent | ParentStudent 关联孩子 | 孩子进度、成果和可见教师反馈 |

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
- 当前浏览器产生的数据：学生学习进度和作品草稿，来自 localStorage。

建议由 `DemoLearningRepository` 合并两层：

```text
mock baseline
    + local progress/work overrides
    = current demo view model
```

同一浏览器内若确认需要跨角色联动，教师和家长端可以读取同一学生的本地 override；若不确认，则只展示基线模拟数据。该策略必须在产品确认后选择，不能两个页面各做一套。

## 7. 数据一致性规则

- 所有外键 ID 必须在 mock 数据加载时通过 Zod `superRefine` 校验存在。
- 汇总数由明细计算，不手写一份“总部学生数”。
- 课程完成率使用统一公式和统一分母；未开始课程是否计入分母需在实现前确定。
- 学生进度不得由教师预览写入。
- 家长只能看到 `visibility=student_and_parent` 的反馈。
- 合作伙伴查询必须限定其 `partnerOrganizationId` 对应校区。
- 课次标题、单元、关键概念从课程 JSON 读取，不复制到业务 mock 数据。
- 日期统一保存 ISO 8601 UTC 字符串，展示层再按本地时区格式化。

## 8. 迁移到数据库

### 8.1 推荐迁移顺序

1. 冻结并版本化当前 Zod 业务模型。
2. 为 Organization、User、Campus、Class、关系表、Progress、Work、Feedback 建数据库表。
3. 用 seed 脚本导入同一份模拟数据，保持原 ID 不变。
4. 实现数据库 Repository，与 mock Repository 通过同一套契约测试。
5. 将服务端页面/query 切换到数据库 Repository。
6. 增加真实 SessionProvider 和服务端授权。
7. 如需保留浏览器学习记录，登录后提供显式导入/合并流程；不得静默覆盖云端数据。

### 8.2 表设计原则

- 组织、用户、班级等规范化为关系表。
- 课程 JSON 保持版本化静态内容，业务表通过 `courseId/lessonId/contentVersion` 引用。
- 高频汇总先实时查询；有性能证据后再引入物化汇总，不提前缓存。
- `LessonProgress` 可保存步骤级聚合，互动尝试量增长后再拆 `InteractionAttempt`。
- 作品内容可用 JSON 列或对象存储引用；选择取决于真实作品大小，第一阶段不决定。
- 所有多租户查询在服务端基于 session scope 授权，不能依赖前端隐藏菜单。

### 8.3 localStorage 数据迁移

真实登录上线时需要明确三种情况：

1. 云端无记录、本地有记录：允许用户确认后导入。
2. 云端有记录、本地无记录：读取云端。
3. 两边都有记录：按 `updatedAt` 不能自动证明业务上应该覆盖，需提供合并规则或用户选择。

第一阶段只需让本地结构包含 `schemaVersion` 和稳定 ID，为未来迁移保留可能性。

## 9. 待确认的数据问题

1. 学生本地新增作品是否应立即出现在同一浏览器的教师端和家长端。
2. 教师新增模拟评价是否应立即出现在家长端。
3. 教师评价的主要关联对象是作品、课次还是学生阶段表现。
4. 合作伙伴演示身份默认对应哪个校区或合作伙伴组织。
5. 第 10 课是否复用前序课次的同一个持续作品。
6. 第 13 课的“发布”是固定模拟结果还是第一阶段真实公开访问。

