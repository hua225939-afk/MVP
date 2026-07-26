import type { DemoRoleId } from "./platform-data.ts";

export type DemoStudentRecord = {
  id: string;
  name: string;
  avatar: string;
  classId: string;
  className: string;
  completedLessons: number;
  currentLessonId: string;
  currentStep: "看" | "讲" | "想" | "做" | "测" | "说";
  projectName: string;
  projectVersion: string;
  latestDecision: string;
  latestChange: string;
  lastActivity: string;
  lastSaved: string;
  testStatus: "全部通过" | "待重测" | "连续失败";
  todoStatus: "待点评" | "需要关注" | "进行中" | "已完成";
  attentionReason: string | null;
  attentionMinutes: number;
};

export const demoStudentRecords: DemoStudentRecord[] = [
  {
    id: "student-an",
    name: "安安",
    avatar: "安",
    classId: "class-demo",
    className: "创意编程演示班",
    completedLessons: 5,
    currentLessonId: "lesson-06",
    currentStep: "测",
    projectName: "校园任务星",
    projectVersion: "0.6",
    latestDecision: "保留点击反馈，同时把计数改成连续累加",
    latestChange: "修正重置后仍从旧数值继续的问题",
    lastActivity: "刚刚完成第 2 次故障扫描",
    lastSaved: "今天 10:18",
    testStatus: "待重测",
    todoStatus: "待点评",
    attentionReason: "有待点评内容",
    attentionMinutes: 8,
  },
  {
    id: "student-miao",
    name: "小淼",
    avatar: "淼",
    classId: "class-demo",
    className: "创意编程演示班",
    completedLessons: 4,
    currentLessonId: "lesson-05",
    currentStep: "做",
    projectName: "阅读心情补给站",
    projectVersion: "0.5",
    latestDecision: "把三个入口合并为一张更清楚的任务卡",
    latestChange: "重新排列输入框、按钮与结果卡",
    lastActivity: "12 分钟前更新组件清单",
    lastSaved: "今天 10:06",
    testStatus: "连续失败",
    todoStatus: "需要关注",
    attentionReason: "连续测试失败",
    attentionMinutes: 12,
  },
  {
    id: "student-le",
    name: "乐乐",
    avatar: "乐",
    classId: "class-demo",
    className: "创意编程演示班",
    completedLessons: 6,
    currentLessonId: "lesson-07",
    currentStep: "想",
    projectName: "兴趣路线生成器",
    projectVersion: "0.7",
    latestDecision: "让用户先选择兴趣，再输入可用时间",
    latestChange: "补充空输入时的友好提示",
    lastActivity: "6 分钟前提交输入输出路线",
    lastSaved: "今天 10:12",
    testStatus: "全部通过",
    todoStatus: "进行中",
    attentionReason: null,
    attentionMinutes: 6,
  },
  {
    id: "student-xing",
    name: "星星",
    avatar: "星",
    classId: "class-demo",
    className: "创意编程演示班",
    completedLessons: 3,
    currentLessonId: "lesson-04",
    currentStep: "说",
    projectName: "校园活动发现页",
    projectVersion: "0.4",
    latestDecision: "使用更安静的蓝紫色，给活动照片留出空间",
    latestChange: "完成平板视口的文字与卡片间距调整",
    lastActivity: "18 分钟前保存风格选择理由",
    lastSaved: "今天 09:58",
    testStatus: "全部通过",
    todoStatus: "待点评",
    attentionReason: "学生主动求助",
    attentionMinutes: 18,
  },
];

export const demoClassSession = {
  id: "session-saturday-06",
  classId: "class-demo",
  className: "创意编程演示班",
  lessonId: "lesson-06",
  lessonTitle: "点击之后会发生什么",
  schedule: "今天 10:00—11:30",
  enrolled: demoStudentRecords.length,
  onlineCreating: 3,
} as const;

export type DemoEvidenceRecord = {
  id: string;
  studentId: string;
  lessonId: string;
  name: string;
  type: string;
  source: "AI生成" | "学生修改" | "最终采用" | "项目记录";
  version: string;
  createdAt: string;
  preview: string;
  fullContent: string;
  modificationReason: string;
  testStatus: string;
  reviewStatus: "待点评" | "需要复查" | "已完成";
};

export const demoEvidenceRecords: DemoEvidenceRecord[] = [
  {
    id: "evidence-an-click-test",
    studentId: "student-an",
    lessonId: "lesson-06",
    name: "点击事件故障扫描",
    type: "测试结果",
    source: "项目记录",
    version: "0.6",
    createdAt: "今天 10:18",
    preview: "第一次点击通过；连续增加通过；重置后仍从旧数值继续，等待重测。",
    fullContent: "测试 1：第一次点击显示反馈，通过。测试 2：连续点击从 1 增加到 3，通过。测试 3：重置后再次点击应从 1 开始，当前等待学生完成重测。",
    modificationReason: "学生发现只改按钮文字不能解决状态残留，因此准备修改重置逻辑。",
    testStatus: "待重测",
    reviewStatus: "待点评",
  },
  {
    id: "evidence-an-intent",
    studentId: "student-an",
    lessonId: "lesson-02",
    name: "项目任务最终稿",
    type: "最终采用内容",
    source: "最终采用",
    version: "0.2",
    createdAt: "本周六 09:35",
    preview: "帮助同学把校园任务拆成今天可以完成的小步骤。",
    fullContent: "为容易忘记校园任务的同学设计一个任务助手，让用户选择任务、看到下一步，并在完成后获得清楚反馈。",
    modificationReason: "从“做一个学习网站”缩小为三步内可以完成的校园任务。",
    testStatus: "范围检查通过",
    reviewStatus: "已完成",
  },
  {
    id: "evidence-miao-components",
    studentId: "student-miao",
    lessonId: "lesson-05",
    name: "功能卡组件修改稿",
    type: "学生修改稿",
    source: "学生修改",
    version: "0.5",
    createdAt: "今天 10:06",
    preview: "把三个入口合并为一张任务卡，减少第一次使用时的选择压力。",
    fullContent: "保留一个主要输入框、一个开始按钮和一张结果卡；删除两个重复入口，并把提示移到输入框上方。",
    modificationReason: "同伴第一次进入页面时不知道应该先点哪一个入口。",
    testStatus: "连续测试失败",
    reviewStatus: "需要复查",
  },
  {
    id: "evidence-le-input",
    studentId: "student-le",
    lessonId: "lesson-07",
    name: "输入输出信号路线",
    type: "互动逻辑",
    source: "项目记录",
    version: "0.7",
    createdAt: "今天 10:12",
    preview: "兴趣选择 → 可用时间 → 生成一条今天可以完成的兴趣路线。",
    fullContent: "用户先从阅读、运动、绘画中选择兴趣，再输入可用分钟数；应用根据两个输入生成一条可执行建议。",
    modificationReason: "先选择兴趣可以让后续时间输入更容易理解。",
    testStatus: "正常、空白、过长输入全部通过",
    reviewStatus: "待点评",
  },
  {
    id: "evidence-xing-theme",
    studentId: "student-xing",
    lessonId: "lesson-04",
    name: "视觉主题最终选择",
    type: "视觉样式",
    source: "最终采用",
    version: "0.4",
    createdAt: "今天 09:58",
    preview: "低饱和蓝紫色 + 大图卡片，为校园活动照片保留视觉空间。",
    fullContent: "主色使用低饱和蓝紫色，背景保持浅灰白；活动照片放在卡片上部，标题和行动按钮使用清楚对比。",
    modificationReason: "原来的高饱和颜色会抢走活动照片的注意力。",
    testStatus: "电脑与平板可读性通过",
    reviewStatus: "待点评",
  },
];

type RoleProfile = {
  name: string;
  avatar: string;
  title: string;
  userNumber: string;
  organization: string;
  intro: string;
  status: string;
  recentVisit: string;
  metrics: { label: string; value: string; detail: string }[];
  activities: string[];
};

export const roleProfiles: Record<DemoRoleId, RoleProfile> = {
  student: {
    name: "安安",
    avatar: "安",
    title: "学生",
    userNumber: "STU-DEMO-001",
    organization: "创意编程演示班",
    intro: "正在把校园里的小问题变成可以点击、测试和持续升级的网页应用。",
    status: "演示学习中",
    recentVisit: "今天 10:18",
    metrics: [
      { label: "当前课程", value: "第 06 课", detail: "点击事件" },
      { label: "当前项目", value: "校园任务星", detail: "版本 0.6" },
      { label: "已完成课程", value: "5 / 13", detail: "持续学习" },
      { label: "作品数量", value: "1", detail: "同一主项目" },
    ],
    activities: ["完成点击事件故障扫描", "保存项目版本 0.6", "收到教师点评提醒"],
  },
  teacher: {
    name: "林老师",
    avatar: "林",
    title: "教师",
    userNumber: "TEA-DEMO-018",
    organization: "徐汇创意演示校区",
    intro: "关注学生的当下行为、项目证据与修改理由，用反馈帮助学生继续创造。",
    status: "今日授课中",
    recentVisit: "今天 09:42",
    metrics: [
      { label: "所带班级", value: "1", detail: "创意编程演示班" },
      { label: "当前课程", value: "第 06 课", detail: "点击事件" },
      { label: "学生数量", value: "4", detail: "集中演示数据" },
      { label: "待点评", value: "3", detail: "项目证据" },
    ],
    activities: ["查看安安的测试证据", "完成星星的视觉主题点评", "打开第 06 课备课卡"],
  },
  parent: {
    name: "安安家长",
    avatar: "家",
    title: "家长",
    userNumber: "PAR-DEMO-001",
    organization: "关联学生：安安",
    intro: "通过成长摘要了解孩子怎样从想法、修改和测试中形成自己的作品。",
    status: "关联正常",
    recentVisit: "昨天 20:15",
    metrics: [
      { label: "关联学生", value: "安安", detail: "创意编程演示班" },
      { label: "成长报告", value: "第 6 周", detail: "演示周报" },
      { label: "教师评语", value: "1", detail: "最新可见" },
      { label: "作品更新", value: "0.6", detail: "校园任务星" },
    ],
    activities: ["查看第 6 周成长报告", "阅读教师评语", "查看作品版本 0.6"],
  },
  partner: {
    name: "星河教育演示校区",
    avatar: "合",
    title: "合作伙伴",
    userNumber: "ORG-DEMO-021",
    organization: "徐汇创意演示校区",
    intro: "查看校区班级、教师安排与课程运营摘要，不接入真实学校业务数据。",
    status: "演示运营中",
    recentVisit: "今天 08:50",
    metrics: [
      { label: "班级数量", value: "1", detail: "当前演示校区" },
      { label: "教师数量", value: "1", detail: "林老师" },
      { label: "学生数量", value: "4", detail: "演示班级" },
      { label: "课程运营", value: "第 06 课", detail: "今日开课" },
    ],
    activities: ["查看今日班级进度", "确认教师安排", "查看课程运营提醒"],
  },
  hq: {
    name: "Vibe Coding Lab 总部",
    avatar: "总",
    title: "总部",
    userNumber: "HQ-DEMO-001",
    organization: "Vibe Coding Lab",
    intro: "维护课程、互动组件与演示平台质量，观察课程从想法到发布的完整链路。",
    status: "演示平台正常",
    recentVisit: "今天 08:30",
    metrics: [
      { label: "管理范围", value: "全平台", detail: "演示数据" },
      { label: "平台课程", value: "1", detail: "13 节课" },
      { label: "合作伙伴", value: "1", detail: "演示组织" },
      { label: "内容状态", value: "已验证", detail: "Schema 通过" },
    ],
    activities: ["完成课程内容校验", "查看互动组件状态", "查看演示校区摘要"],
  },
};

export type DemoMessage = {
  id: string;
  type: string;
  title: string;
  summary: string;
  time: string;
  unread: boolean;
};

const sharedSystemMessage: DemoMessage = {
  id: "system-demo-mode",
  type: "系统通知",
  title: "演示数据模式已启用",
  summary: "当前页面不连接真实账号、学校数据或消息推送服务。",
  time: "今天 08:00",
  unread: false,
};

export const roleMessages: Record<DemoRoleId, DemoMessage[]> = {
  student: [
    { id: "student-review", type: "教师反馈", title: "林老师留下了新的项目点评", summary: "查看你在点击事件测试中做得好的地方与下一步建议。", time: "10 分钟前", unread: true },
    { id: "student-course", type: "课程提醒", title: "继续完成第 06 课故障扫描", summary: "还有一项重置测试等待重新运行。", time: "今天 10:05", unread: true },
    { id: "student-version", type: "版本保存", title: "项目版本 0.6 已保存在当前浏览器", summary: "校园任务星的点击反馈与测试记录已更新。", time: "今天 09:52", unread: false },
    sharedSystemMessage,
  ],
  teacher: [
    { id: "teacher-help", type: "学生求助", title: "星星在视觉主题环节请求帮助", summary: "学生已经停留 18 分钟，并提交了具体问题。", time: "6 分钟前", unread: true },
    { id: "teacher-review", type: "待点评作品", title: "安安提交了点击事件测试证据", summary: "包含失败记录、修改说明和待重测状态。", time: "12 分钟前", unread: true },
    { id: "teacher-class", type: "班级课程提醒", title: "本节课将在 11:30 结束", summary: "建议先处理连续失败和主动求助学生。", time: "今天 10:20", unread: false },
    sharedSystemMessage,
  ],
  parent: [
    { id: "parent-report", type: "学习周报", title: "安安的第 6 周成长摘要已生成", summary: "本周重点：点击事件、失败重测与修改说明。", time: "昨天 18:30", unread: true },
    { id: "parent-feedback", type: "教师评语", title: "林老师更新了阶段评语", summary: "孩子已经能用测试证据说明为什么修改。", time: "昨天 17:45", unread: false },
    { id: "parent-work", type: "作品更新", title: "校园任务星更新到版本 0.6", summary: "新增点击反馈，并保留了一次失败—修改记录。", time: "昨天 17:20", unread: false },
    sharedSystemMessage,
  ],
  partner: [
    { id: "partner-class", type: "班级运营", title: "创意编程演示班今日正常开课", summary: "4 名演示学生，3 名处于在线创作状态。", time: "今天 10:02", unread: true },
    { id: "partner-teacher", type: "教师安排", title: "林老师已进入第 06 课教学", summary: "当前待点评 3 项，需要关注 2 名学生。", time: "今天 09:58", unread: false },
    { id: "partner-course", type: "课程进度", title: "班级进入互动功能单元", summary: "演示班级当前主要学习点击事件。", time: "昨天 16:00", unread: false },
    sharedSystemMessage,
  ],
  hq: [
    { id: "hq-campus", type: "校区状态", title: "徐汇创意演示校区今日开课", summary: "班级、教师和学生演示关系均通过一致性检查。", time: "今天 10:00", unread: true },
    { id: "hq-content", type: "课程内容", title: "13 节课程内容验证通过", summary: "5 个单元、13 节课与工具注册表引用一致。", time: "今天 09:10", unread: false },
    { id: "hq-component", type: "组件状态", title: "互动组件注册表状态正常", summary: "课程渲染链路未发现缺失的组件映射。", time: "今天 09:00", unread: false },
    sharedSystemMessage,
  ],
};

export const helpTopics = [
  ["开始课程", "从学习中心选择当前课次，按看、讲、想、做、测、说完成六步。"],
  ["创建项目", "第 01 课创建课程主项目，后续课程持续修改同一个项目。"],
  ["进入创造台", "从课程的“做”环节、Vibe创作基地或我的作品进入。"],
  ["保存作品", "确认工具修改后，项目会保存在当前浏览器的 ProjectRepository。"],
  ["查看版本", "在创造台版本记录或我的作品详情中查看阶段快照。"],
  ["运行测试", "根据失败证据返回对应工具修改，再重新运行测试。"],
  ["发布作品", "第 13 课完成公开模式检查后生成演示发布页面。"],
  ["教师查看证据", "从学生进度进入学生详情，再打开项目证据并完成点评。"],
] as const;
