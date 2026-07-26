import { z } from "zod";

export const PHASES = ["看", "讲", "想", "做", "测", "说"] as const;
export const COURSE_ID = "vibe-coding-foundations";

const nonEmptyText = z.string().trim().min(1);
const idSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const lessonIdSchema = z.string().regex(/^lesson-(0[1-9]|1[0-3])$/);
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const strictTextList = z.array(nonEmptyText).min(1);

export const phaseSchema = z.enum(PHASES);

const audienceSchema = z
  .object({
    grades: nonEmptyText,
    ages: nonEmptyText,
    prerequisites: nonEmptyText,
  })
  .strict();

const unitSchema = z
  .object({
    id: z.string().regex(/^unit-0[1-5]$/),
    order: z.number().int().min(1).max(5),
    title: nonEmptyText.max(100),
    description: nonEmptyText,
    lessonIds: z.array(lessonIdSchema).min(1),
    parentSummary: nonEmptyText,
  })
  .strict();

export const courseSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: idSchema,
    slug: idSchema,
    title: nonEmptyText.max(100),
    subtitle: nonEmptyText.max(160),
    audience: audienceSchema,
    totalLessons: z.literal(13),
    learningRhythm: z.tuple([
      z.literal("看"),
      z.literal("讲"),
      z.literal("想"),
      z.literal("做"),
      z.literal("测"),
      z.literal("说"),
    ]),
    units: z.array(unitSchema).length(5),
    status: z.enum(["draft", "published", "archived"]),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
  })
  .strict()
  .superRefine((course, context) => {
    const unitIds = course.units.map((unit) => unit.id);
    const unitOrders = course.units.map((unit) => unit.order);
    const lessonIds = course.units.flatMap((unit) => unit.lessonIds);

    if (new Set(unitIds).size !== unitIds.length) {
      context.addIssue({ code: "custom", path: ["units"], message: "单元 ID 不得重复" });
    }
    if (new Set(unitOrders).size !== unitOrders.length) {
      context.addIssue({ code: "custom", path: ["units"], message: "单元顺序不得重复" });
    }
    if (new Set(lessonIds).size !== lessonIds.length) {
      context.addIssue({ code: "custom", path: ["units"], message: "课次 ID 不得重复引用" });
    }
    if (lessonIds.length !== course.totalLessons) {
      context.addIssue({
        code: "custom",
        path: ["units"],
        message: `课程必须引用 ${course.totalLessons} 个课次`,
      });
    }
    course.units.forEach((unit, index) => {
      if (unit.order !== index + 1) {
        context.addIssue({
          code: "custom",
          path: ["units", index, "order"],
          message: "单元必须按 order 顺序排列",
        });
      }
    });
  });

const atomBaseSchema = z
  .object({
    id: idSchema,
    title: nonEmptyText,
    instructions: nonEmptyText.optional(),
    required: z.boolean(),
    analyticsKey: idSchema.optional(),
  })
  .strict();

const revealAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("reveal"),
    prompt: nonEmptyText,
    content: nonEmptyText,
    buttonLabel: nonEmptyText,
  })
  .strict();

const choiceOptionSchema = z
  .object({ id: idSchema, label: nonEmptyText })
  .strict();

const valueOptionSchema = z
  .object({ id: idSchema, label: nonEmptyText, value: nonEmptyText })
  .strict();

const choiceAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("choice"),
    question: nonEmptyText,
    options: z.array(choiceOptionSchema).min(2),
    correctOptionId: idSchema,
    explanation: nonEmptyText,
    incorrectMessage: nonEmptyText,
  })
  .strict()
  .superRefine((atom, context) => {
    const optionIds = atom.options.map((option) => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      context.addIssue({ code: "custom", path: ["options"], message: "选项 ID 不得重复" });
    }
    if (!optionIds.includes(atom.correctOptionId)) {
      context.addIssue({
        code: "custom",
        path: ["correctOptionId"],
        message: "正确答案必须引用现有选项",
      });
    }
  });

const oneOfValidationSchema = z
  .object({
    mode: z.literal("oneOf"),
    acceptedAnswers: strictTextList,
    normalize: z
      .array(z.enum(["trim", "lowercase", "removeWhitespace", "removePunctuation"]))
      .min(1),
  })
  .strict();

const minLengthValidationSchema = z
  .object({
    mode: z.literal("minLength"),
    minLength: z.number().int().positive(),
  })
  .strict();

const textInputAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("textInput"),
    question: nonEmptyText,
    placeholder: nonEmptyText,
    validation: z.discriminatedUnion("mode", [
      oneOfValidationSchema,
      minLengthValidationSchema,
    ]),
    successMessage: nonEmptyText,
    hint: nonEmptyText,
  })
  .strict();

const previewInteractionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("none"),
      buttonLabel: nonEmptyText,
      observationMessage: nonEmptyText,
    })
    .strict(),
  z
    .object({
      type: z.literal("message"),
      buttonLabel: nonEmptyText,
      clickedHeading: nonEmptyText,
      clickedText: nonEmptyText,
    })
    .strict(),
  z
    .object({
      type: z.literal("color"),
      buttonLabel: nonEmptyText,
      clickedText: nonEmptyText,
      clickedAccent: hexColorSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("counter"),
      buttonLabel: nonEmptyText,
      resetLabel: nonEmptyText,
      counterLabel: nonEmptyText,
      start: z.number().int(),
      step: z.number().int().refine((value) => value !== 0, "步长不能为 0"),
    })
    .strict(),
]);

const previewSchema = z
  .object({
    eyebrow: nonEmptyText.optional(),
    heading: nonEmptyText,
    text: nonEmptyText,
    accent: hexColorSchema,
    interaction: previewInteractionSchema,
  })
  .strict();

const codePreviewAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("codePreview"),
    description: nonEmptyText,
    language: nonEmptyText,
    code: nonEmptyText.optional(),
    sourceAtomId: idSchema.optional(),
    sourceValuePath: z.literal("generatedCode").optional(),
    preview: previewSchema,
    confirmationLabel: nonEmptyText,
  })
  .strict()
  .superRefine((atom, context) => {
    if (!atom.code && !atom.sourceAtomId) {
      context.addIssue({
        code: "custom",
        path: ["code"],
        message: "代码预览必须提供 code 或 sourceAtomId",
      });
    }
  });

const runTestRuleSchema = z
  .object({
    id: idSchema,
    label: nonEmptyText,
    includes: nonEmptyText,
    message: nonEmptyText,
  })
  .strict();

const runTestAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("runTest"),
    description: nonEmptyText,
    language: nonEmptyText,
    testMode: z.literal("contains"),
    initialCode: nonEmptyText.optional(),
    sourceAtomId: idSchema.optional(),
    sourceValuePath: z.literal("generatedCode").optional(),
    tests: z.array(runTestRuleSchema).min(1),
    successMessage: nonEmptyText,
    retryMessage: nonEmptyText,
    editable: z.boolean(),
  })
  .strict()
  .superRefine((atom, context) => {
    const testIds = atom.tests.map((test) => test.id);
    if (new Set(testIds).size !== testIds.length) {
      context.addIssue({ code: "custom", path: ["tests"], message: "测试 ID 不得重复" });
    }
    if (!atom.initialCode && !atom.sourceAtomId) {
      context.addIssue({
        code: "custom",
        path: ["initialCode"],
        message: "测试必须提供 initialCode 或 sourceAtomId",
      });
    }
  });

const taskTextFieldSchema = z
  .object({
    id: idSchema,
    label: nonEmptyText,
    control: z.literal("text"),
    placeholder: nonEmptyText,
    defaultValue: z.string(),
    minLength: z.number().int().positive(),
    required: z.boolean(),
  })
  .strict();

const taskSelectFieldSchema = z
  .object({
    id: idSchema,
    label: nonEmptyText,
    control: z.literal("select"),
    options: z.array(valueOptionSchema).min(2),
    defaultValue: z.string(),
    required: z.boolean(),
  })
  .strict();

const taskColorFieldSchema = z
  .object({
    id: idSchema,
    label: nonEmptyText,
    control: z.literal("color"),
    options: z
      .array(
        z
          .object({
            id: idSchema,
            label: nonEmptyText,
            value: hexColorSchema,
          })
          .strict(),
      )
      .min(2),
    defaultValue: hexColorSchema,
    required: z.boolean(),
  })
  .strict();

const taskMultiSelectFieldSchema = z
  .object({
    id: idSchema,
    label: nonEmptyText,
    control: z.literal("multiSelect"),
    options: z.array(valueOptionSchema).min(2),
    defaultValue: z.array(nonEmptyText),
    minSelections: z.number().int().positive(),
    required: z.boolean(),
  })
  .strict()
  .superRefine((field, context) => {
    if (field.minSelections > field.options.length) {
      context.addIssue({
        code: "custom",
        path: ["minSelections"],
        message: "最小选择数不能超过选项数",
      });
    }
  });

const taskFieldSchema = z.discriminatedUnion("control", [
  taskTextFieldSchema,
  taskSelectFieldSchema,
  taskColorFieldSchema,
  taskMultiSelectFieldSchema,
]);

const taskPreviewSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("webCard"),
      appNameFieldId: idSchema,
      directionFieldId: idSchema,
      titleFieldId: idSchema,
      accentFieldId: idSchema,
      styleFieldId: idSchema,
      buttonFieldId: idSchema,
      messageFieldId: idSchema,
      adaptationFieldId: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("interactiveCard"),
      taskFieldId: idSchema,
      effectsFieldId: idSchema,
      feedbackFieldId: idSchema,
      accentFieldId: idSchema,
      startValueFieldId: idSchema,
      activateLabel: nonEmptyText,
      resetLabel: nonEmptyText,
      deliberateBug: z.enum(["none", "counter-and-reset"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("record"),
      heading: nonEmptyText,
    })
    .strict(),
]);

const taskBuilderAtomSchema = atomBaseSchema
  .extend({
    type: z.literal("taskBuilder"),
    description: nonEmptyText,
    fields: z.array(taskFieldSchema).min(1),
    preview: taskPreviewSchema,
    minimumChanges: z.number().int().nonnegative(),
    requiredChangeFieldIds: z.array(idSchema),
    saveLabel: nonEmptyText,
    successMessage: nonEmptyText,
  })
  .strict()
  .superRefine((atom, context) => {
    const fieldIds = atom.fields.map((field) => field.id);
    if (new Set(fieldIds).size !== fieldIds.length) {
      context.addIssue({ code: "custom", path: ["fields"], message: "字段 ID 不得重复" });
    }
    atom.requiredChangeFieldIds.forEach((fieldId, index) => {
      if (!fieldIds.includes(fieldId)) {
        context.addIssue({
          code: "custom",
          path: ["requiredChangeFieldIds", index],
          message: "指定修改字段必须引用现有字段",
        });
      }
    });
    const previewRefs = Object.entries(atom.preview)
      .filter(([key]) => key.endsWith("FieldId"))
      .map(([, value]) => value);
    previewRefs.forEach((fieldId) => {
      if (typeof fieldId === "string" && !fieldIds.includes(fieldId)) {
        context.addIssue({
          code: "custom",
          path: ["preview"],
          message: `预览引用了不存在的字段 ${fieldId}`,
        });
      }
    });
  });

export const interactionAtomSchema = z.discriminatedUnion("type", [
  revealAtomSchema,
  choiceAtomSchema,
  textInputAtomSchema,
  codePreviewAtomSchema,
  runTestAtomSchema,
  taskBuilderAtomSchema,
]);

const stepStudentContentSchema = z
  .object({
    intro: nonEmptyText,
    instructions: nonEmptyText,
    completionMessage: nonEmptyText,
  })
  .strict();

const stepTeacherNotesSchema = z
  .object({
    purpose: nonEmptyText,
    talkingPoints: strictTextList,
    observeFor: strictTextList,
  })
  .strict();

const assistantSchema = z
  .object({
    mode: z.literal("preset"),
    message: nonEmptyText,
    hints: strictTextList,
  })
  .strict();

const completionSchema = z
  .object({
    mode: z.literal("allRequired"),
    requiredAtomIds: z.array(idSchema).min(1),
  })
  .strict();

export const lessonStepSchema = z
  .object({
    id: idSchema,
    phase: phaseSchema,
    title: nonEmptyText,
    durationMinutes: z.number().int().positive(),
    goal: nonEmptyText,
    studentContent: stepStudentContentSchema,
    teacherNotes: stepTeacherNotesSchema,
    assistant: assistantSchema,
    atoms: z.array(interactionAtomSchema).min(1),
    completion: completionSchema,
  })
  .strict()
  .superRefine((step, context) => {
    const atomIds = step.atoms.map((atom) => atom.id);
    if (new Set(atomIds).size !== atomIds.length) {
      context.addIssue({ code: "custom", path: ["atoms"], message: "互动原子 ID 不得重复" });
    }
    const requiredIds = new Set(
      step.atoms.filter((atom) => atom.required).map((atom) => atom.id),
    );
    for (const [index, atomId] of step.completion.requiredAtomIds.entries()) {
      if (!requiredIds.has(atomId)) {
        context.addIssue({
          code: "custom",
          path: ["completion", "requiredAtomIds", index],
          message: "完成规则必须引用当前步骤的必做原子",
        });
      }
    }
    if (
      requiredIds.size !== step.completion.requiredAtomIds.length ||
      step.completion.requiredAtomIds.some((atomId) => !requiredIds.has(atomId))
    ) {
      context.addIssue({
        code: "custom",
        path: ["completion", "requiredAtomIds"],
        message: "完成规则必须完整列出所有必做原子",
      });
    }
  });

const lessonOutputSchema = z
  .object({
    title: nonEmptyText,
    description: nonEmptyText,
    acceptanceCriteria: strictTextList,
  })
  .strict();

const lessonTeacherNotesSchema = z
  .object({
    objectives: strictTextList,
    preparation: strictTextList,
    commonIssues: strictTextList,
    facilitationTips: strictTextList,
  })
  .strict();

const lessonStudentContentSchema = z
  .object({
    opening: nonEmptyText,
    safetyNote: nonEmptyText,
    completionMessage: nonEmptyText,
  })
  .strict();

const parentSummarySchema = z
  .object({
    theme: nonEmptyText,
    learned: nonEmptyText,
    artifact: nonEmptyText,
    conversationStarter: nonEmptyText,
  })
  .strict();

export const lessonSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: lessonIdSchema,
    courseId: idSchema,
    unitId: z.string().regex(/^unit-0[1-5]$/),
    order: z.number().int().min(1).max(13),
    title: nonEmptyText.max(100),
    subtitle: nonEmptyText.max(160),
    studentSubtitle: nonEmptyText.max(100),
    durationMinutes: z.number().int().positive(),
    coreGoal: nonEmptyText,
    keyConcepts: strictTextList,
    skills: strictTextList,
    output: lessonOutputSchema,
    teacherNotes: lessonTeacherNotesSchema,
    studentContent: lessonStudentContentSchema,
    parentSummary: parentSummarySchema,
    steps: z.array(lessonStepSchema).length(6),
  })
  .strict()
  .superRefine((lesson, context) => {
    const lessonNumber = Number(lesson.id.slice(-2));
    if (lesson.order !== lessonNumber) {
      context.addIssue({
        code: "custom",
        path: ["order"],
        message: "课次 order 必须与 lesson ID 序号一致",
      });
    }
    const stepIds = lesson.steps.map((step) => step.id);
    const atomIds = lesson.steps.flatMap((step) => step.atoms.map((atom) => atom.id));
    if (new Set(stepIds).size !== stepIds.length) {
      context.addIssue({ code: "custom", path: ["steps"], message: "步骤 ID 不得重复" });
    }
    if (new Set(atomIds).size !== atomIds.length) {
      context.addIssue({ code: "custom", path: ["steps"], message: "课次内原子 ID 不得重复" });
    }
    const flattenedAtoms = lesson.steps.flatMap((step, stepIndex) =>
      step.atoms.map((atom, atomIndex) => ({ atom, stepIndex, atomIndex })),
    );
    flattenedAtoms.forEach(({ atom, stepIndex, atomIndex }, currentIndex) => {
      if ("sourceAtomId" in atom && atom.sourceAtomId) {
        const sourceIndex = flattenedAtoms.findIndex(
          (item) => item.atom.id === atom.sourceAtomId,
        );
        if (sourceIndex < 0 || sourceIndex >= currentIndex) {
          context.addIssue({
            code: "custom",
            path: ["steps", stepIndex, "atoms", atomIndex, "sourceAtomId"],
            message: "数据来源必须引用当前原子之前已定义的互动原子",
          });
        }
      }
    });
    lesson.steps.forEach((step, index) => {
      if (step.phase !== PHASES[index]) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "phase"],
          message: `第 ${index + 1} 步必须是“${PHASES[index]}”`,
        });
      }
      const expectedId = `${lesson.id}.${["look", "explain", "think", "make", "test", "share"][index]}`;
      if (step.id !== expectedId) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "id"],
          message: `步骤 ID 必须是 ${expectedId}`,
        });
      }
    });
    const totalMinutes = lesson.steps.reduce(
      (total, step) => total + step.durationMinutes,
      0,
    );
    if (totalMinutes !== lesson.durationMinutes) {
      context.addIssue({
        code: "custom",
        path: ["durationMinutes"],
        message: "六步时长总和必须等于课次时长",
      });
    }
  });

export type Course = z.infer<typeof courseSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type InteractionAtom = z.infer<typeof interactionAtomSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
