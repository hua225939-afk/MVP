import { z } from "zod";

export const stepTypeSchema = z.enum(["看", "讲", "想", "做", "测", "说"]);

const baseBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});

const revealSchema = baseBlockSchema.extend({
  type: z.literal("reveal"),
  prompt: z.string().min(1),
  content: z.string().min(1),
  buttonLabel: z.string().default("揭晓答案"),
});

const choiceSchema = baseBlockSchema.extend({
  type: z.literal("choice"),
  question: z.string().min(1),
  options: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .min(2),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(1),
});

const textInputSchema = baseBlockSchema.extend({
  type: z.literal("textInput"),
  question: z.string().min(1),
  placeholder: z.string().default("在这里写下你的答案"),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  successMessage: z.string().min(1),
  hint: z.string().optional(),
});

const codePreviewSchema = baseBlockSchema.extend({
  type: z.literal("codePreview"),
  description: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
  preview: z.object({
    eyebrow: z.string().optional(),
    heading: z.string().min(1),
    text: z.string().min(1),
    buttonLabel: z.string().optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
});

const runTestSchema = baseBlockSchema.extend({
  type: z.literal("runTest"),
  description: z.string().min(1),
  language: z.string().min(1),
  initialCode: z.string().min(1),
  tests: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        includes: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .min(1),
});

export const interactionBlockSchema = z.discriminatedUnion("type", [
  revealSchema,
  choiceSchema,
  textInputSchema,
  codePreviewSchema,
  runTestSchema,
]);

export const lessonStepSchema = z.object({
  id: z.string().min(1),
  type: stepTypeSchema,
  title: z.string().min(1),
  goal: z.string().min(1),
  teacher: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    keyPoint: z.string().min(1),
  }),
  assistant: z.object({
    message: z.string().min(1),
    hints: z.array(z.string().min(1)).min(1),
  }),
  intro: z.string().min(1),
  blocks: z.array(interactionBlockSchema).min(1),
});

export const lessonSchema = z.object({
  id: z.string().regex(/^lesson-[0-9]{2}$/),
  order: z.number().int().positive(),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  duration: z.string().min(1),
  level: z.string().min(1),
  badge: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  skills: z.array(z.string().min(1)).min(1),
  steps: z.array(lessonStepSchema).length(6),
});

export type StepType = z.infer<typeof stepTypeSchema>;
export type InteractionBlock = z.infer<typeof interactionBlockSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
