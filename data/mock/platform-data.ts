export type DemoRoleId = "hq" | "partner" | "teacher" | "student" | "parent";

export type DemoRole = {
  id: DemoRoleId;
  name: string;
  description: string;
  audience: string;
  href: string;
  symbol: string;
  navigation: { label: string; href: string; symbol: string }[];
};

export const demoRoles: DemoRole[] = [
  {
    id: "hq",
    name: "总部",
    description: "查看平台整体运营、课程结构与互动组件使用情况。",
    audience: "课程与运营团队",
    href: "/hq",
    symbol: "总",
    navigation: [
      { label: "运营总览", href: "/hq", symbol: "⌂" },
      { label: "课程管理", href: "/hq/courses", symbol: "课" },
      { label: "组件库", href: "/hq/components", symbol: "组" },
    ],
  },
  {
    id: "partner",
    name: "合作伙伴",
    description: "查看所属校区、班级、教师与课程进展。",
    audience: "校区运营负责人",
    href: "/partner",
    symbol: "合",
    navigation: [
      { label: "校区总览", href: "/partner", symbol: "⌂" },
      { label: "班级列表", href: "/partner#classes", symbol: "班" },
      { label: "教师团队", href: "/partner#teachers", symbol: "师" },
    ],
  },
  {
    id: "teacher",
    name: "教师",
    description: "查看任教班级、学生进度与课程作品。",
    audience: "授课教师",
    href: "/teacher",
    symbol: "师",
    navigation: [
      { label: "教学总览", href: "/teacher", symbol: "⌂" },
      { label: "我的班级", href: "/teacher#classes", symbol: "班" },
      { label: "学生进度", href: "/teacher#students", symbol: "学" },
      { label: "作品概览", href: "/teacher#works", symbol: "作" },
    ],
  },
  {
    id: "student",
    name: "学生",
    description: "继续六步学习旅程，完成互动并保存本地进度。",
    audience: "小学高年级至初中生",
    href: "/student",
    symbol: "学",
    navigation: [
      { label: "创造基地", href: "/student", symbol: "⌂" },
      { label: "学习中心", href: "/student/courses", symbol: "课" },
      { label: "我的作品", href: "/student/projects", symbol: "作" },
    ],
  },
  {
    id: "parent",
    name: "家长",
    description: "了解孩子的学习进度、成果与教师反馈。",
    audience: "学生家长",
    href: "/parent",
    symbol: "家",
    navigation: [
      { label: "成长总览", href: "/parent", symbol: "⌂" },
      { label: "学习进度", href: "/parent#progress", symbol: "进" },
      { label: "课程成果", href: "/parent#works", symbol: "作" },
      { label: "教师反馈", href: "/parent#feedback", symbol: "评" },
    ],
  },
];

type Campus = {
  id: string;
  partnerId: string;
  name: string;
  city: string;
  status: "active" | "planned";
};

type ClassRecord = {
  id: string;
  campusId: string;
  name: string;
  teacherId: string;
  schedule: string;
  room: string;
};

type Person = {
  id: string;
  name: string;
};

type Student = Person & {
  classId: string;
};

type ProgressRecord = {
  studentId: string;
  completedLessons: number;
  currentLessonId: string;
  percent: number;
};

type Work = {
  id: string;
  studentId: string;
  title: string;
  lessonId: string;
  status: "草稿" | "已完成" | "演示发布";
  updatedAt: string;
};

type Feedback = {
  id: string;
  studentId: string;
  teacherId: string;
  summary: string;
  visibleToParent: boolean;
  date: string;
};

export type CoursePlanLesson = {
  id: string;
  order: number;
  title: string;
  concept: string;
};

export type CourseUnit = {
  id: string;
  title: string;
  description: string;
  lessons: CoursePlanLesson[];
};

export const courseUnits: CourseUnit[] = [
  {
    id: "unit-01",
    title: "认识 Vibe Coding",
    description: "从自然语言需求出发，理解应用任务。",
    lessons: [
      { id: "plan-01", order: 1, title: "一句话唤醒第一个网页", concept: "需求与迭代" },
      { id: "plan-02", order: 2, title: "把灵感变成 App 任务", concept: "输入与输出" },
    ],
  },
  {
    id: "unit-02",
    title: "搭建网页界面",
    description: "学习网页结构、视觉样式和组件组合。",
    lessons: [
      { id: "plan-03", order: 3, title: "搭好网页的内容骨架", concept: "HTML 结构" },
      { id: "plan-04", order: 4, title: "给网页穿上设计外衣", concept: "CSS 与视觉" },
      { id: "plan-05", order: 5, title: "用组件拼出功能页面", concept: "组件与流程" },
    ],
  },
  {
    id: "unit-03",
    title: "让网页真正动起来",
    description: "用事件、输入、条件和状态构建互动。",
    lessons: [
      { id: "plan-06", order: 6, title: "点击之后会发生什么", concept: "点击事件" },
      { id: "plan-07", order: 7, title: "让网页听懂我的输入", concept: "输入与输出" },
      { id: "plan-08", order: 8, title: "不同选择，不同结果", concept: "条件判断" },
      { id: "plan-09", order: 9, title: "让网页记住操作过程", concept: "状态记录" },
    ],
  },
  {
    id: "unit-04",
    title: "完成自己的网页应用",
    description: "组合功能、调试问题并根据反馈迭代。",
    lessons: [
      { id: "plan-10", order: 10, title: "组合功能，生成应用 1.0", concept: "最小可行产品" },
      { id: "plan-11", order: 11, title: "和 AI 一起抓住 Bug", concept: "测试与调试" },
      { id: "plan-12", order: 12, title: "交换试玩，升级应用 2.0", concept: "反馈与迭代" },
    ],
  },
  {
    id: "unit-05",
    title: "应用发布与成果展示",
    description: "完成发布检查并清楚介绍创作过程。",
    lessons: [
      { id: "plan-13", order: 13, title: "上线！我的应用发布会", concept: "发布与表达" },
    ],
  },
];

export const interactionCatalog = Object.entries(interactionMetadata).map(
  ([id, metadata]) => ({
    id,
    ...metadata,
    usedBy: "第 01 / 06 课样板",
  }),
);

const campuses: Campus[] = [
  { id: "campus-xuhui", partnerId: "partner-star", name: "徐汇创意校区", city: "上海", status: "active" },
  { id: "campus-pudong", partnerId: "partner-star", name: "浦东科技校区", city: "上海", status: "active" },
  { id: "campus-hangzhou", partnerId: "partner-lake", name: "滨江未来校区", city: "杭州", status: "planned" },
];

const teachers: Person[] = [
  { id: "teacher-lin", name: "林老师" },
  { id: "teacher-zhou", name: "周老师" },
  { id: "teacher-chen", name: "陈老师" },
];

const classes: ClassRecord[] = [
  { id: "class-a", campusId: "campus-xuhui", name: "创意编程 A 班", teacherId: "teacher-lin", schedule: "周六 10:00", room: "探索教室 1" },
  { id: "class-b", campusId: "campus-xuhui", name: "创意编程 B 班", teacherId: "teacher-zhou", schedule: "周日 14:00", room: "探索教室 2" },
  { id: "class-c", campusId: "campus-pudong", name: "网页应用启蒙班", teacherId: "teacher-chen", schedule: "周六 14:30", room: "创作教室" },
  { id: "class-d", campusId: "campus-hangzhou", name: "秋季体验班", teacherId: "teacher-chen", schedule: "待排课", room: "待确认" },
];

const students: Student[] = [
  { id: "student-an", name: "安安", classId: "class-a" },
  { id: "student-yu", name: "小宇", classId: "class-a" },
  { id: "student-ke", name: "可可", classId: "class-a" },
  { id: "student-mu", name: "木木", classId: "class-b" },
  { id: "student-le", name: "乐乐", classId: "class-b" },
  { id: "student-yi", name: "一一", classId: "class-c" },
  { id: "student-nuo", name: "诺诺", classId: "class-c" },
  { id: "student-xin", name: "小新", classId: "class-c" },
];

const progress: ProgressRecord[] = [
  { studentId: "student-an", completedLessons: 1, currentLessonId: "lesson-06", percent: 72 },
  { studentId: "student-yu", completedLessons: 0, currentLessonId: "lesson-01", percent: 48 },
  { studentId: "student-ke", completedLessons: 2, currentLessonId: "lesson-06", percent: 100 },
  { studentId: "student-mu", completedLessons: 0, currentLessonId: "lesson-01", percent: 39 },
  { studentId: "student-le", completedLessons: 1, currentLessonId: "lesson-06", percent: 81 },
  { studentId: "student-yi", completedLessons: 0, currentLessonId: "lesson-01", percent: 44 },
  { studentId: "student-nuo", completedLessons: 0, currentLessonId: "lesson-01", percent: 16 },
  { studentId: "student-xin", completedLessons: 1, currentLessonId: "lesson-06", percent: 67 },
];

const works: Work[] = [
  { id: "work-1", studentId: "student-an", title: "星球欢迎卡", lessonId: "lesson-01", status: "已完成", updatedAt: "2026-07-24" },
  { id: "work-2", studentId: "student-yu", title: "我的欢迎页", lessonId: "lesson-01", status: "草稿", updatedAt: "2026-07-23" },
  { id: "work-3", studentId: "student-ke", title: "太空挑战按钮", lessonId: "lesson-06", status: "演示发布", updatedAt: "2026-07-24" },
  { id: "work-4", studentId: "student-le", title: "彩虹挑战按钮", lessonId: "lesson-06", status: "已完成", updatedAt: "2026-07-22" },
  { id: "work-5", studentId: "student-yi", title: "校园欢迎卡", lessonId: "lesson-01", status: "草稿", updatedAt: "2026-07-21" },
];

const feedback: Feedback[] = [
  { id: "feedback-1", studentId: "student-an", teacherId: "teacher-lin", summary: "已经能清楚区分网页结构、样式和互动，下一步可以多尝试不同反馈文案。", visibleToParent: true, date: "2026-07-24" },
  { id: "feedback-2", studentId: "student-yu", teacherId: "teacher-lin", summary: "对视觉样式很敏感，建议完成按钮互动后再进行一次完整测试。", visibleToParent: true, date: "2026-07-23" },
  { id: "feedback-3", studentId: "student-ke", teacherId: "teacher-lin", summary: "课堂内部调试记录。", visibleToParent: false, date: "2026-07-24" },
];

export const mockDatabase = {
  campuses,
  classes,
  teachers,
  students,
  progress,
  works,
  feedback,
};

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const studentName = (studentId: string) =>
  students.find((student) => student.id === studentId)?.name ?? "未知学生";

export function getHqDashboard() {
  return {
    stats: {
      campuses: campuses.length,
      classes: classes.length,
      teachers: teachers.length,
      students: students.length,
      completion: average(progress.map((item) => item.percent)),
      works: works.length,
    },
    campuses: campuses.map((campus) => {
      const campusClasses = classes.filter((item) => item.campusId === campus.id);
      const classIds = new Set(campusClasses.map((item) => item.id));
      const campusStudents = students.filter((student) => classIds.has(student.classId));
      return { ...campus, classCount: campusClasses.length, studentCount: campusStudents.length };
    }),
  };
}

// TODO: 产品确认合作伙伴演示身份后，再替换此固定演示范围。
const demoPartnerId = "partner-star";
const demoTeacherId = "teacher-lin";
const demoStudentId = "student-an";

export function getPartnerDashboard() {
  const scopedCampuses = campuses.filter((campus) => campus.partnerId === demoPartnerId);
  const campusIds = new Set(scopedCampuses.map((campus) => campus.id));
  const scopedClasses = classes.filter((item) => campusIds.has(item.campusId));
  const classIds = new Set(scopedClasses.map((item) => item.id));
  const scopedStudents = students.filter((student) => classIds.has(student.classId));
  const scopedTeacherIds = new Set(scopedClasses.map((item) => item.teacherId));
  const scopedProgress = progress.filter((item) =>
    scopedStudents.some((student) => student.id === item.studentId),
  );

  return {
    partnerName: "星河教育",
    campuses: scopedCampuses,
    classes: scopedClasses,
    teachers: teachers.filter((teacher) => scopedTeacherIds.has(teacher.id)),
    stats: {
      campuses: scopedCampuses.length,
      classes: scopedClasses.length,
      teachers: scopedTeacherIds.size,
      students: scopedStudents.length,
      completion: average(scopedProgress.map((item) => item.percent)),
    },
  };
}

export function getTeacherDashboard() {
  const teacher = teachers.find((item) => item.id === demoTeacherId)!;
  const scopedClasses = classes.filter((item) => item.teacherId === demoTeacherId);
  const classIds = new Set(scopedClasses.map((item) => item.id));
  const scopedStudents = students.filter((student) => classIds.has(student.classId));
  const scopedProgress = progress
    .filter((item) => scopedStudents.some((student) => student.id === item.studentId))
    .map((item) => ({ ...item, studentName: studentName(item.studentId) }));
  const scopedWorks = works
    .filter((work) => scopedStudents.some((student) => student.id === work.studentId))
    .map((work) => ({ ...work, studentName: studentName(work.studentId) }));

  return {
    teacher,
    classes: scopedClasses,
    students: scopedProgress,
    works: scopedWorks,
    stats: {
      classes: scopedClasses.length,
      students: scopedStudents.length,
      completion: average(scopedProgress.map((item) => item.percent)),
      works: scopedWorks.length,
    },
  };
}

export function getDemoStudentProfile() {
  return students.find((item) => item.id === demoStudentId)!;
}

export function getParentDashboard() {
  const student = students.find((item) => item.id === demoStudentId)!;
  const studentProgress = progress.find((item) => item.studentId === demoStudentId)!;
  const studentWorks = works.filter((work) => work.studentId === demoStudentId);
  const visibleFeedback = feedback
    .filter((item) => item.studentId === demoStudentId && item.visibleToParent)
    .map((item) => ({
      ...item,
      teacherName: teachers.find((teacher) => teacher.id === item.teacherId)?.name ?? "教师",
    }));
  return { student, progress: studentProgress, works: studentWorks, feedback: visibleFeedback };
}
import { interactionMetadata } from "@/lib/interaction-types";
