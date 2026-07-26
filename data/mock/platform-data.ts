import { brand } from "@/config/brand";

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
    description: "查看所属演示校区、班级、教师与课程进展。",
    audience: "校区运营负责人",
    href: "/partner",
    symbol: "合",
    navigation: [
      { label: "校区总览", href: "/partner", symbol: "⌂" },
      { label: "班级数据", href: "/partner#classes", symbol: "班" },
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
      { label: "教学总览", href: "/teacher", symbol: "⌂" },
      { label: "学生进度", href: "/teacher#students", symbol: "学" },
      { label: "项目证据", href: "/teacher#works", symbol: "作" },
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
      { label: brand.studentSpaceName, href: "/student", symbol: "⌂" },
      { label: brand.learningCenterName, href: "/student/courses", symbol: "课" },
      { label: brand.projectLibraryName, href: "/student/projects", symbol: "作" },
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
      { label: "成长总览", href: "/parent", symbol: "⌂" },
      { label: "学习进度", href: "/parent#progress", symbol: "进" },
      { label: "课程成果", href: "/parent#works", symbol: "作" },
      { label: "教师评语", href: "/parent#feedback", symbol: "评" },
    ],
  },
];
