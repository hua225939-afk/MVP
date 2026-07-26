# Vibe Coding 创意编程课程平台页面地图

## 1. 文档目的

本文档描述 Vibe Coding 创意编程课程平台第一阶段的产品页面、页面使用者、核心目的、主要模块、数据来源、可操作范围和页面跳转关系。

本轮只定义产品页面地图，不涉及路由实现、页面代码或技术方案。

## 2. 第一阶段页面规则

- 第一阶段提供总部、合作伙伴、教师、学生和家长五种身份体验入口。
- 所有角色端口均使用模拟身份和模拟数据。
- 页面需要明确标注当前为演示数据。
- 第一阶段不使用真实登录。
- 学生课程内容来自课程内容数据，学习进度和课程作品保存在本地设备。
- 总部、合作伙伴、教师和家长端展示的业务数据均为模拟数据。
- 第一阶段不提供真实组织管理、财务、支付、招生或复杂权限操作。

## 3. 公共入口

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 所有访问者 | 介绍平台，并提供五种身份的演示入口 | 平台介绍；课程定位；五种身份体验入口；当前演示说明 | 平台介绍内容；模拟身份数据 | 可操作：选择演示身份并进入对应端口；不进行真实登录 | `/hq`；`/partner`；`/teacher`；`/student`；`/parent` |

## 4. 总部端

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/hq` | 总部 | 总览平台整体运营与课程使用情况 | 演示数据说明；校区数量；班级数量；教师数量；学生数量；课程完成率；作品数量；总部端导航 | 模拟整体运营数据 | 可操作：浏览总部端各页面；不可进行真实组织管理或权限分配 | `/hq/courses`；`/hq/components`；`/hq/campuses`；`/hq/analytics`；`/` |
| `/hq/courses` | 总部 | 查看 5 个单元、13 课的课程结构 | 课程地图；单元列表；课程列表；每课目标；关键概念；原子组件信息 | 课程大纲与模拟课程数据 | 只读查看；不可编辑或发布课程 | `/hq`；`/hq/components`；`/hq/analytics`；`/` |
| `/hq/components` | 总部 | 查看课程使用的原子组件库 | 原子组件分类；组件名称；组件用途；关联课程 | 模拟原子组件数据；课程大纲中的原子组件信息 | 只读查看；不可创建、修改或删除组件 | `/hq`；`/hq/courses`；`/` |
| `/hq/campuses` | 总部 | 查看校区及其基础数据 | 校区列表；班级数量；教师数量；学生数量；课程进度概览 | 模拟校区、班级、教师、学生和课程进度数据 | 只读查看；不可进行真实校区或组织管理 | `/hq`；`/hq/analytics`；`/` |
| `/hq/analytics` | 总部 | 查看平台整体课程完成情况和作品情况 | 整体完成率；不同课程完成率；作品数量；校区数据概览 | 模拟汇总运营数据 | 只读查看；不进行真实数据配置 | `/hq`；`/hq/courses`；`/hq/campuses`；`/` |

## 5. 合作伙伴端

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/partner` | 合作伙伴 | 总览所属校区的教学和运营情况 | 演示数据说明；所属校区；班级数量；教师数量；课程进度；合作伙伴端导航 | 所属校区的模拟运营数据 | 可操作：浏览所属校区的演示数据；不可查看其他校区或进行真实管理 | `/partner/campuses`；`/partner/classes`；`/partner/teachers`；`/partner/schedule`；`/` |
| `/partner/campuses` | 合作伙伴 | 查看所属校区信息 | 校区基本信息；班级数量；教师数量；课程进度；运营数据概览 | 所属校区的模拟数据 | 只读查看；不可新增、修改或删除校区 | `/partner`；`/partner/classes`；`/partner/teachers`；`/` |
| `/partner/classes` | 合作伙伴 | 查看所属校区的班级情况 | 班级列表；任课教师；课程安排；课程进度 | 所属校区的模拟班级、教师和课程数据 | 只读查看；不可进行真实班级管理 | `/partner`；`/partner/campuses`；`/partner/teachers`；`/partner/schedule`；`/` |
| `/partner/teachers` | 合作伙伴 | 查看所属校区的教师情况 | 教师列表；所属班级；相关课程与排课 | 所属校区的模拟教师、班级和排课数据 | 只读查看；不可邀请、编辑或分配真实教师账号 | `/partner`；`/partner/classes`；`/partner/schedule`；`/` |
| `/partner/schedule` | 合作伙伴 | 查看所属校区的排课情况 | 排课列表；班级；教师；课程；课次 | 所属校区的模拟排课数据 | 只读查看；不可创建或修改真实排课 | `/partner`；`/partner/classes`；`/partner/teachers`；`/` |

## 6. 教师端

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/teacher` | 教师 | 总览自己的课程、班级、学生进度和作品 | 演示数据说明；我的班级；课程进度；学生完成情况；作品概览；教师端导航 | 模拟教师、班级、学生、进度和作品数据 | 可操作：浏览教师端页面；不进行真实账号邀请 | `/teacher/classes`；`/teacher/courses`；`/teacher/students`；`/teacher/works`；`/` |
| `/teacher/classes` | 教师 | 查看自己的班级和班级学习情况 | 班级列表；学生数量；课程安排；班级课程进度 | 模拟班级、学生、排课和课程进度数据 | 只读查看；不可创建真实班级或邀请账号 | `/teacher`；`/teacher/students`；`/teacher/courses`；`/teacher/works`；`/` |
| `/teacher/courses` | 教师 | 预览 13 节课程及每课教学内容 | 5 单元课程地图；13 课列表；课程目标；六步教学流程；原子组件；课程预览入口 | 课程大纲与课程内容数据 | 可操作：选择并预览课程；不可编辑或发布课程 | `/teacher`；`/learn/[courseId]/[lessonId]`；`/teacher/classes`；`/` |
| `/teacher/students` | 教师 | 查看自己班级学生的学习情况 | 学生列表；所属班级；课程进度；完成状态；测试结果；作品概览 | 模拟学生、班级、学习进度、测试和作品数据 | 只读查看学生学习情况；不进行真实账号邀请 | `/teacher`；`/teacher/classes`；`/teacher/works`；`/` |
| `/teacher/works` | 教师 | 查看学生作品并添加模拟评价 | 作品列表；作品完成状态；作品预览；教师模拟评价 | 模拟学生作品与模拟教师评价数据 | 可操作：查看作品并添加模拟评价；不产生正式评价记录 | `/teacher`；`/teacher/students`；`/teacher/classes`；`/` |

## 7. 学生端

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/student` | 学生 | 总览自己的课程地图、学习进度、作品和奖励 | 演示身份说明；5 单元课程地图；13 课进度；作品概览；课程奖励；学生端导航 | 课程内容数据；本地学习进度；本地课程作品；模拟奖励数据 | 可操作：进入课程、查看作品和奖励；不使用真实登录 | `/student/courses`；`/student/works`；`/learn/[courseId]/[lessonId]`；`/` |
| `/student/courses` | 学生 | 查看 5 个单元、13 课的课程地图并继续学习 | 单元列表；课程列表；课程目标；完成状态；学习进度；进入或继续课程入口 | 课程内容数据；localStorage 中的学习进度 | 可操作：选择课程并进入或继续学习 | `/student`；`/learn/[courseId]/[lessonId]`；`/student/works`；`/` |
| `/student/works` | 学生 | 查看自己在课程中保存的作品 | 作品列表；关联课程；作品完成状态；作品预览入口 | localStorage 中保存的课程作品 | 可操作：查看已保存作品，并返回相关课程继续创作 | `/student`；`/student/courses`；`/learn/[courseId]/[lessonId]`；`/` |
| `/learn/[courseId]/[lessonId]` | 学生；教师预览课程时使用 | 完成指定课程和课次的六步学习任务 | 当前课程信息；六步学习导航；AI 老师讲解；AI 学习助手；互动实验；代码编辑与运行；测试反馈；课程产出；进度保存 | 对应课程内容数据；localStorage 中的学习进度和课程作品 | 可操作：完成互动实验、编辑和运行代码、运行测试、保存进度和作品；教师进入时用于课程预览 | `/student`；`/student/courses`；`/student/works`；`/teacher/courses`；`/` |

## 8. 家长端

| 页面 | 页面使用者 | 页面核心目的 | 页面主要模块 | 页面数据来源 | 第一阶段是否可操作 | 可以跳转到的页面 |
| --- | --- | --- | --- | --- | --- | --- |
| `/parent` | 家长 | 总览孩子的学习进度、课程成果和教师评价 | 演示数据说明；学习进度概览；课程成果；公开作品；教师评价；家长端导航 | 模拟学生进度、成果、公开作品和教师评价数据 | 可操作：浏览家长端各页面；不显示复杂代码或详细调试记录 | `/parent/progress`；`/parent/works`；`/parent/feedback`；`/` |
| `/parent/progress` | 家长 | 查看孩子的课程学习进度 | 5 单元进度；13 课完成状态；阶段性学习情况 | 模拟学生学习进度数据 | 只读查看；不可修改学习进度 | `/parent`；`/parent/works`；`/parent/feedback`；`/` |
| `/parent/works` | 家长 | 查看孩子的课程成果和公开作品 | 课程成果列表；公开作品；作品说明 | 模拟课程成果和公开作品数据 | 只读查看；不显示复杂代码和详细调试记录 | `/parent`；`/parent/progress`；`/parent/feedback`；`/` |
| `/parent/feedback` | 家长 | 查看教师评价 | 教师评价；关联课程或作品；阶段性成长信息 | 模拟教师评价数据 | 只读查看；不可修改教师评价 | `/parent`；`/parent/progress`；`/parent/works`；`/` |

## 9. 页面层级

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
│   └── /learn/[courseId]/[lessonId]
└── /parent
    ├── /parent/progress
    ├── /parent/works
    └── /parent/feedback
```

## 10. 高保真演示外壳与教师工作流补充

本阶段在不引入真实登录、数据库、消息服务和真实 AI 的前提下，补充统一产品外壳和教师可点击工作流。

- 五个角色端复用同一 `RoleShell` 顶部栏、侧边导航、演示标识、搜索面板、消息预览和用户菜单。
- `/profile`、`/messages`、`/settings`、`/help` 为五个角色共用页面，通过演示角色上下文展示不同静态内容，不复制五套页面。
- 教师流程为 `/teacher` → `/teacher/students` → `/teacher/students/[studentId]` → `/teacher/evidence` → `/teacher/reviews`。
- 教师学生详情只读投影学习进度与 `ProjectDocument`；教师评语写入独立 `PlatformRepository`，不得修改学生项目 revision。
- `/teacher/courses`、`/teacher/prep`、`/teacher/reports` 为只读教学辅助页面；课程预览继续使用 `mode=preview`。
- 其他角色新增导航中的业务入口可使用完整静态演示页面，不提供看似可操作但无反馈的主要按钮。
- 公共页通过 `?role=hq|partner|teacher|student|parent` 保留演示角色上下文；无参数时默认学生角色。
