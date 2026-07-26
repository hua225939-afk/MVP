import { brand } from "../../config/brand.ts";

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
      { label: "平台总览", href: "/hq", symbol: "览" },
      { label: "合作伙伴", href: "/hq/partners", symbol: "合" },
      { label: "校区与班级", href: "/hq/campuses", symbol: "校" },
      { label: "课程中心", href: "/hq/courses", symbol: "课" },
      { label: "互动组件", href: "/hq/components", symbol: "组" },
      { label: "内容状态", href: "/hq/content", symbol: "态" },
      { label: "数据报表", href: "/hq/analytics", symbol: "数" },
      { label: "消息", href: "/messages?role=hq", symbol: "信" },
      { label: "我的", href: "/profile?role=hq", symbol: "我" },
      { label: "设置", href: "/settings?role=hq", symbol: "设" },
    ],
  },
  {
    id: "partner",
    name: "合作伙伴",
    description: "查看所属演示校区、班级、教师与课程进展。",
    audience: "校区运营负责人",
    href: "/partner",
    symbol: "合",
    navigation: [
      { label: "运营概览", href: "/partner", symbol: "览" },
      { label: "班级", href: "/partner/classes", symbol: "班" },
      { label: "教师", href: "/partner/teachers", symbol: "师" },
      { label: "学生", href: "/partner/students", symbol: "学" },
      { label: "课程运营", href: "/partner/courses", symbol: "课" },
      { label: "数据概览", href: "/partner/analytics", symbol: "数" },
      { label: "消息", href: "/messages?role=partner", symbol: "信" },
      { label: "我的", href: "/profile?role=partner", symbol: "我" },
      { label: "设置", href: "/settings?role=partner", symbol: "设" },
    ],
  },
  {
    id: "teacher",
    name: "教师",
    description: "查看演示班级学生进度、项目证据并填写简短评语。",
    audience: "授课教师",
    href: "/teacher",
    symbol: "师",
    navigation: [
      { label: "教学总览", href: "/teacher", symbol: "览" },
      { label: "学生进度", href: "/teacher/students", symbol: "学" },
      { label: "项目证据", href: "/teacher/evidence", symbol: "证" },
      { label: "点评待办", href: "/teacher/reviews", symbol: "评" },
      { label: "我的课程", href: "/teacher/courses", symbol: "课" },
      { label: "备课与示范", href: "/teacher/prep", symbol: "备" },
      { label: "成长报告", href: "/teacher/reports", symbol: "报" },
      { label: "消息", href: "/messages?role=teacher", symbol: "信" },
      { label: "我的", href: "/profile?role=teacher", symbol: "我" },
      { label: "设置", href: "/settings?role=teacher", symbol: "设" },
    ],
  },
  {
    id: "student",
    name: "学生",
    description: "继续学习与创作，并在当前浏览器保存进度和项目。",
    audience: "小学高年级至初中生",
    href: "/student",
    symbol: "学",
    navigation: [
      { label: brand.learningCenterName, href: "/student/courses", symbol: "课" },
      { label: brand.studentSpaceName, href: "/student", symbol: "创" },
      { label: brand.projectLibraryName, href: "/student/projects", symbol: "作" },
      { label: brand.galleryName, href: "/gallery", symbol: "广" },
      { label: "成就", href: "/student/achievements", symbol: "章" },
      { label: "消息", href: "/messages?role=student", symbol: "信" },
      { label: "我的", href: "/profile?role=student", symbol: "我" },
      { label: "设置", href: "/settings?role=student", symbol: "设" },
    ],
  },
  {
    id: "parent",
    name: "家长",
    description: "查看关联学生的成长摘要、版本与教师评语。",
    audience: "学生家长",
    href: "/parent",
    symbol: "家",
    navigation: [
      { label: "成长看板", href: "/parent", symbol: "览" },
      { label: "学习进度", href: "/parent/progress", symbol: "进" },
      { label: "作品", href: "/parent/works", symbol: "作" },
      { label: "教师评语", href: "/parent/feedback", symbol: "评" },
      { label: "成长报告", href: "/parent/reports", symbol: "报" },
      { label: "消息", href: "/messages?role=parent", symbol: "信" },
      { label: "我的", href: "/profile?role=parent", symbol: "我" },
      { label: "设置", href: "/settings?role=parent", symbol: "设" },
    ],
  },
];
