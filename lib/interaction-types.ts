import type { InteractionAtom } from "@/lib/lesson-schema";

export const registeredInteractionTypes = [
  "reveal",
  "choice",
  "textInput",
  "codePreview",
  "runTest",
  "taskBuilder",
  "courseTool",
] as const satisfies readonly InteractionAtom["type"][];

export type InteractionType = (typeof registeredInteractionTypes)[number];

export const interactionMetadata: Record<
  InteractionType,
  { name: string; purpose: string }
> = {
  reveal: { name: "点击揭晓", purpose: "逐步展示案例、提示与 AI 老师讲解" },
  choice: { name: "单项选择", purpose: "检查概念理解并提供内容化反馈" },
  textInput: { name: "文本输入", purpose: "收集结构化任务与自由学习表达" },
  codePreview: { name: "代码与互动预览", purpose: "对照代码并亲自体验页面反馈" },
  runTest: { name: "安全规则检查", purpose: "编辑代码并按预设包含规则验证" },
  taskBuilder: {
    name: "结构化创造台",
    purpose: "通过选择、填写和即时预览生成或保存结构化作品",
  },
  courseTool: {
    name: "课程创造工具",
    purpose: "通过统一工具注册表读写当前 ProjectDocument",
  },
};
