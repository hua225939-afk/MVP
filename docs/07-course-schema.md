# Vibe Coding 课程内容 Schema 设计

## 1. 设计目标

课程 Schema 用于把课程内容与页面代码分离，并保证：

- 一门课程包含 5 个单元和 13 个课次。
- 每个课次使用“看、讲、想、做、测、说”六个学习环节。
- 每个步骤由可复用互动原子组成。
- 教师说明、学生内容、家长摘要可以从同一份课程内容读取。
- 课次通过声明式 `projectBinding` 和 `toolId` 读写同一个 `ProjectDocument`，课程 JSON 不复制项目内容。
- 创造工具通过独立注册表定义解锁、输入输出、测试和 React 组件，不为单课扩展 `LessonRenderer` 分支。
- 所有 JSON 在开发、测试和构建阶段通过 Zod 验证。
- 新增课次主要增加 JSON，不复制页面组件。

本设计是目标 Schema；当前 `lib/lesson-schema.ts` 只实现单课和五种互动的较小子集。

## 2. 内容分层

```text
Course
└── Unit[]
    └── lessonIds[]

Lesson
└── Step[6]
    └── InteractionAtom[]
```

课程清单与课次正文分文件保存，避免一个超大 JSON：

```text
content/courses/vibe-coding-foundations.json
content/lessons/lesson-01.json
content/lessons/lesson-06.json
```

### 2.1 Course

| 字段 | 类型 | 约束 | 用途 |
| --- | --- | --- | --- |
| `schemaVersion` | number | 正整数，当前为 1 | 内容迁移 |
| `id` | string | kebab-case，唯一 | 稳定课程 ID |
| `slug` | string | kebab-case，唯一 | 路由与展示 |
| `title` | string | 1–100 字 | 课程名称 |
| `subtitle` | string | 1–160 字 | 课程副标题 |
| `audience` | object | 年级、年龄或能力描述 | 教师/家长说明 |
| `totalLessons` | number | 当前必须为 13 | 完整性检查 |
| `learningRhythm` | array | 固定六阶段顺序 | 课程节奏 |
| `units` | array | 当前必须为 5 个 | 单元清单 |
| `status` | enum | `draft/published/archived` | 内容状态；第一阶段只读 |
| `version` | string | SemVer 风格 | 内容版本 |

### 2.2 Unit

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | string | 在课程内唯一 |
| `order` | number | 正整数且不重复 |
| `title` | string | 非空 |
| `description` | string | 非空 |
| `lessonIds` | string[] | 至少 1 项，全课程合计 13 个且不得重复 |
| `parentSummary` | string | 面向家长的单元价值摘要 |

### 2.3 Lesson

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `schemaVersion` | number | 当前为 1 | 课次结构版本 |
| `id` | string | `lesson-01` 至 `lesson-13` | 稳定 ID |
| `courseId` | string | 必须引用存在的 Course | 所属课程 |
| `unitId` | string | 必须引用存在的 Unit | 所属单元 |
| `order` | number | 1–13，且等于 ID 序号 | 课次顺序 |
| `title` | string | 非空 | 课次名称 |
| `subtitle` | string | 非空 | 学生端摘要 |
| `durationMinutes` | number | 正整数 | 建议 90 |
| `coreGoal` | string | 非空 | 核心目标 |
| `keyConcepts` | string[] | 至少 1 项 | 第 12 课缺失时必须先确认，不能默默填充 |
| `skills` | string[] | 至少 1 项 | 课程地图标签 |
| `output` | object | `title/description/acceptanceCriteria` | 课程产出 |
| `teacherNotes` | object | 教学目标、准备、常见问题、提示 | 教师端 |
| `studentContent` | object | 引导语、安全说明、完成提示 | 学生端 |
| `parentSummary` | object | 主题、学到什么、成果说明 | 家长端 |
| `projectBinding` | object | 本课项目读取、写入、前置字段、造物档案和下一课交接 | 持续项目契约 |
| `steps` | Step[] | 恰好 6 个，类型与顺序固定 | 六步课程 |

### 2.4 Step

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | string | 建议 `{lessonId}.{phase}`，全课唯一 |
| `phase` | enum | `看/讲/想/做/测/说` |
| `title` | string | 非空 |
| `durationMinutes` | number | 正整数；六步合计应等于课次时长 |
| `goal` | string | 非空 |
| `studentContent` | object | `intro/instructions/completionMessage` |
| `teacherNotes` | object | `purpose/talkingPoints/observeFor` |
| `assistant` | object | 固定模拟文案与 hints；不得暗示已接真实 AI |
| `atoms` | InteractionAtom[] | 至少 1 个 |
| `completion` | object | 完成模式与必需原子 ID |

`projectBinding` 目标结构：

```ts
type LessonProjectBinding = {
  projectRequired: true;
  readPaths: ProjectFieldPath[];
  writePaths: ProjectFieldPath[];
  primaryToolId: string;
  prerequisitePaths: ProjectFieldPath[];
  archiveMappings: Array<{
    sourceAtomId: string;
    targetPath: ProjectFieldPath;
  }>;
  nextLessonReads: ProjectFieldPath[];
};
```

- 第 01 课允许 `createProject: true`；第 02—13 课必须 `projectRequired: true` 且不得创建新主项目。
- `writePaths` 必须是对应工具注册表 `output` 的子集。
- `archiveMappings` 只映射结构化互动结果，不把整份学习进度复制到项目。
- Loader 在课程级验证上一课 `nextLessonReads` 能覆盖下一课前置字段。

## 3. 六个学习环节的表达

产品文档中的“看案例—懂原理—拆任务—动手做—运行测试—讲出理解”，在学生界面简写为“看、讲、想、做、测、说”：

| `phase` | 课程含义 | 默认时长 | 常见互动 |
| --- | --- | --- | --- |
| `看` | 看案例 | 10 分钟 | `reveal`、`codePreview` |
| `讲` | 懂原理 | 10 分钟 | `reveal`、`choice` |
| `想` | 拆任务 | 15 分钟 | `choice`、`textInput` |
| `做` | 动手做 | 35 分钟 | `codePreview`、后续可确认的编辑/模拟原子 |
| `测` | 运行测试 | 15 分钟 | `runTest` |
| `说` | 讲出理解 | 5 分钟 | `textInput`；语音不在第一阶段 |

Zod 除了验证 `length(6)`，还需用 `superRefine` 验证顺序必须严格等于：

```ts
const PHASES = ["看", "讲", "想", "做", "测", "说"] as const;
```

不能只验证六个值存在，否则重复“看”或顺序错乱也会通过。

## 4. 互动原子与课程工具

### 4.1 公共字段

每个互动原子共享：

```ts
type AtomBase = {
  id: string;
  type: string;
  title: string;
  instructions?: string;
  required: boolean;
  analyticsKey?: string;
};
```

`id` 建议使用 `{lessonId}.{phase}.{atomName}`，确保 localStorage、作品和分析数据不因数组调整而失效。

### 4.2 已有原子

当前样板实际使用以下六类：

| `type` | 核心字段 | 标准完成条件 |
| --- | --- | --- |
| `reveal` | `prompt/content/buttonLabel` | 用户揭晓 |
| `choice` | `question/options/correctOptionId/explanation/incorrectMessage` | 选择正确答案 |
| `textInput` | `question/placeholder/validation/successMessage/hint` | 通过指定验证 |
| `codePreview` | `description/language/code/preview` | 用户确认已观察 |
| `runTest` | `description/language/initialCode/tests/testMode` | 所有规则通过 |
| `taskBuilder` | `fields/preview/minimumChanges/requiredChangeFieldIds` | 指定字段有效修改并保存 |

`runTest.testMode` 第一阶段固定为 `contains`，明确表示字符串规则检查，不执行任意学生代码。若未来实现安全沙箱，必须增加新的模式和安全评审，不能只改文案。

Zod 使用判别联合：

```ts
const interactionAtomSchema = z.discriminatedUnion("type", [
  revealAtomSchema,
  choiceAtomSchema,
  textInputAtomSchema,
  codePreviewAtomSchema,
  runTestAtomSchema,
]);
```

不为课程大纲中的每个模块名称直接创建组件。例如“案例对比”“完成检查”“故障按钮”应先判断能否由已有原子组合表达；只有出现新的操作模型时才新增原子类型。

当前仓库实际已有第六类 `taskBuilder`，用于结构化字段、即时预览和保存样板产出。创造台架构落地后：

- `taskBuilder` 仍是可复用互动原子，不再承担完整创造台职责。
- 正式项目修改由 `courseTool` 宿主原子或等价工具调用结构完成。
- 宿主只引用 `toolId/mode/projectBinding`，具体 React 组件从工具注册表取得。

建议目标原子：

```ts
type CourseToolAtom = AtomBase & {
  type: "courseTool";
  toolId: string;
  mode: "basic" | "free";
  projectBinding: {
    readPaths: ProjectFieldPath[];
    writePaths: ProjectFieldPath[];
  };
  completionRuleIds: string[];
};
```

不要把 13 个工具各自做成 13 个 atom type。`courseTool` 是统一宿主，工具差异由注册表和项目 Schema 表达。

### 4.3 工具注册 Schema

工具注册表与课程内容分离，但必须在构建时交叉验证：

```ts
const courseToolDefinitionSchema = z.object({
  id: idSchema,
  name: nonEmptyText,
  lessonIds: z.array(lessonIdSchema).min(1),
  unlock: toolUnlockRuleSchema,
  input: z.array(projectFieldPathSchema),
  output: z.array(projectFieldPathSchema),
  basicMode: toolModeSchema,
  freeMode: toolModeSchema,
  testRules: z.array(toolTestRuleSchema).min(1),
  projectMutation: projectMutationContractSchema,
  componentKey: idSchema,
}).strict();
```

注册表完整性检查：

- 13 个主工具 ID 唯一，主课次覆盖 lesson-01 至 lesson-13。
- 课程引用的 `toolId` 必须存在，工具声明的 React `componentKey` 必须存在于组件 registry。
- `input/output` 只能引用 ProjectDocument Schema 中存在的路径。
- 课次 `writePaths` 不得超出工具 `output`。
- 基础模式和自由模式都必须声明测试、安全和保存行为。
- 删除或改名工具前必须扫描课次、项目版本和迁移引用。

## 5. Zod 字段设计

建议以严格对象为默认，避免 JSON 拼写错误静默进入页面：

```ts
const idSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptyText = z.string().trim().min(1);
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const phaseSchema = z.enum(["看", "讲", "想", "做", "测", "说"]);

const lessonSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^lesson-(0[1-9]|1[0-3])$/),
    courseId: idSchema,
    unitId: idSchema,
    order: z.number().int().min(1).max(13),
    title: nonEmptyText.max(100),
    subtitle: nonEmptyText.max(160),
    durationMinutes: z.number().int().positive(),
    coreGoal: nonEmptyText,
    keyConcepts: z.array(nonEmptyText).min(1),
    skills: z.array(nonEmptyText).min(1),
    output: lessonOutputSchema,
    teacherNotes: lessonTeacherNotesSchema,
    studentContent: lessonStudentContentSchema,
    parentSummary: parentSummarySchema,
    projectBinding: lessonProjectBindingSchema,
    steps: z.array(lessonStepSchema).length(6),
  })
  .strict()
  .superRefine(validateLessonInvariants);
```

跨字段校验至少包括：

- `lesson.id` 的数字与 `order` 一致。
- 六步 `phase` 顺序固定且步骤 ID 不重复。
- 原子 ID 在课次内不重复。
- `completion.requiredAtomIds` 均能在当前步骤找到，且必须指向 `required: true` 原子。
- `choice.correctOptionId` 必须引用存在的 option。
- `runTest.tests[].id` 不重复。
- 六步时长总和与 `durationMinutes` 一致；若允许误差需明确规则。
- Course 中单元 ID、课次 ID、顺序和总数不重复。
- Loader 需验证 Lesson 的 `courseId/unitId` 与课程清单引用一致。
- Lesson 的 `projectBinding.primaryToolId` 存在，且读写路径符合工具权限。
- 第 02—13 课不得创建新课程主项目；13 课必须连续引用同一项目上下文。
- 项目字段或工具配置改变后，引用旧 project revision 的测试结果不能继续算作通过。

### 5.1 文本输入验证

当前 `acceptedAnswers` 只适合暗号题。目标结构显式区分：

```json
{
  "validation": {
    "mode": "oneOf",
    "acceptedAnswers": ["反馈", "回应"],
    "normalize": ["trim", "lowercase", "removePunctuation"]
  }
}
```

自由表达使用：

```json
{
  "validation": {
    "mode": "minLength",
    "minLength": 8
  }
}
```

避免把学生反思强制成唯一标准答案。

## 6. 第 01 课简化 JSON 示例

以下示例省略部分教师提示和重复步骤字段，用于说明结构，不作为可直接入库的完整 90 分钟内容：

```json
{
  "schemaVersion": 1,
  "id": "lesson-01",
  "courseId": "vibe-coding-foundations",
  "unitId": "unit-01",
  "order": 1,
  "title": "一句话唤醒第一个网页",
  "subtitle": "从自然语言需求到可点击欢迎页",
  "durationMinutes": 90,
  "coreGoal": "体验需求、生成、运行、修改和验证的完整过程。",
  "keyConcepts": ["需求", "HTML", "CSS", "JavaScript", "迭代"],
  "skills": ["结构化表达", "观察代码", "运行检查"],
  "output": {
    "title": "互动欢迎页",
    "description": "一个可以点击并产生反馈的欢迎网页。",
    "acceptanceCriteria": ["页面可以打开", "按钮可以点击", "至少人工修改一处"]
  },
  "teacherNotes": {
    "objectives": ["区分网页骨架、外观和动作"],
    "preparation": ["准备静态与互动欢迎页对比"],
    "commonIssues": ["学生可能把 AI 生成误解为无需判断"]
  },
  "studentContent": {
    "opening": "今天把一句想法变成第一张互动欢迎卡。",
    "safetyNote": "第一阶段 AI 回复为预设演示内容。",
    "completionMessage": "你完成了第一次需求到网页的迭代。"
  },
  "parentSummary": {
    "theme": "认识网页与人机协作",
    "learned": "孩子能区分网页结构、样式和互动。",
    "artifact": "一张可点击的欢迎网页。"
  },
  "steps": [
    {
      "id": "lesson-01.look",
      "phase": "看",
      "title": "对比两个欢迎页",
      "durationMinutes": 10,
      "goal": "观察静态页面与互动页面的差异",
      "studentContent": {
        "intro": "点击揭晓两者最关键的不同。",
        "instructions": "先观察，再回答。",
        "completionMessage": "你找到了互动反馈。"
      },
      "teacherNotes": {
        "purpose": "建立完整作品印象",
        "talkingPoints": ["页面可以对操作作出回应"],
        "observeFor": ["学生能否说出点击前后的变化"]
      },
      "assistant": {
        "mode": "preset",
        "message": "注意点击按钮后发生了什么。",
        "hints": ["看文字有没有变化"]
      },
      "atoms": [
        {
          "id": "lesson-01.look.compare",
          "type": "reveal",
          "title": "案例对比",
          "instructions": "观察后揭晓",
          "required": true,
          "prompt": "互动欢迎页比静态欢迎页多了什么？",
          "content": "它会在点击按钮后显示新的欢迎反馈。",
          "buttonLabel": "揭晓差异"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.look.compare"]
      }
    },
    {
      "id": "lesson-01.explain",
      "phase": "讲",
      "title": "认识骨架、外观和动作",
      "durationMinutes": 10,
      "goal": "区分 HTML、CSS 和 JavaScript",
      "studentContent": {
        "intro": "选择负责按钮点击动作的语言。",
        "instructions": "根据三种语言的分工作答。",
        "completionMessage": "你理解了三种语言的分工。"
      },
      "teacherNotes": {
        "purpose": "建立三种网页语言的整体模型",
        "talkingPoints": ["HTML 是骨架", "CSS 是外观", "JavaScript 是动作"],
        "observeFor": ["避免进入语法细节"]
      },
      "assistant": {
        "mode": "preset",
        "message": "想想哪一种语言负责动作。",
        "hints": ["它通常简称 JS"]
      },
      "atoms": [
        {
          "id": "lesson-01.explain.roles",
          "type": "choice",
          "title": "语言分工",
          "required": true,
          "question": "哪一种语言主要负责点击互动？",
          "options": [
            { "id": "html", "label": "HTML" },
            { "id": "css", "label": "CSS" },
            { "id": "js", "label": "JavaScript" }
          ],
          "correctOptionId": "js",
          "explanation": "JavaScript 负责监听点击并更新页面。",
          "incorrectMessage": "再回想“骨架—外观—动作”的比喻。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.explain.roles"]
      }
    },
    {
      "id": "lesson-01.think",
      "phase": "想",
      "title": "拆解欢迎卡",
      "durationMinutes": 15,
      "goal": "明确标题、按钮和点击结果",
      "studentContent": {
        "intro": "写出按钮点击后应该出现的反馈。",
        "instructions": "至少写 8 个字。",
        "completionMessage": "需求已经足够具体。"
      },
      "teacherNotes": {
        "purpose": "从模糊想法转为可操作需求",
        "talkingPoints": ["说清用户操作和结果"],
        "observeFor": ["反馈是否可见"]
      },
      "assistant": {
        "mode": "preset",
        "message": "使用“点击后，页面会……”开头。",
        "hints": ["结果要让用户看得见"]
      },
      "atoms": [
        {
          "id": "lesson-01.think.requirement",
          "type": "textInput",
          "title": "需求填写器",
          "required": true,
          "question": "点击欢迎按钮后，页面应该怎样回应？",
          "placeholder": "点击后，页面会……",
          "validation": { "mode": "minLength", "minLength": 8 },
          "successMessage": "需求表达清楚。",
          "hint": "写清页面会显示什么。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.think.requirement"]
      }
    },
    {
      "id": "lesson-01.make",
      "phase": "做",
      "title": "生成并修改欢迎页",
      "durationMinutes": 35,
      "goal": "观察代码与页面，并完成一处修改",
      "studentContent": {
        "intro": "查看预设生成结果并修改欢迎语。",
        "instructions": "第一阶段不调用真实 AI。",
        "completionMessage": "你完成了一次人工修改。"
      },
      "teacherNotes": {
        "purpose": "体验人负责判断和修改",
        "talkingPoints": ["AI 输出不是最终答案"],
        "observeFor": ["学生是否能指出自己的修改"]
      },
      "assistant": {
        "mode": "preset",
        "message": "先找欢迎语，再决定如何改。",
        "hints": ["修改可见文字最容易验证"]
      },
      "atoms": [
        {
          "id": "lesson-01.make.preview",
          "type": "codePreview",
          "title": "欢迎页代码与预览",
          "required": true,
          "description": "观察标题、按钮和反馈的对应关系。",
          "language": "html",
          "code": "<h1>欢迎来到我的创意站</h1><button>认识我</button>",
          "preview": {
            "heading": "欢迎来到我的创意站",
            "text": "点击按钮开始探索。",
            "buttonLabel": "认识我",
            "accent": "#7C3AED"
          }
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.make.preview"]
      }
    },
    {
      "id": "lesson-01.test",
      "phase": "测",
      "title": "完成运行检查",
      "durationMinutes": 15,
      "goal": "验证页面、按钮和反馈",
      "studentContent": {
        "intro": "补齐关键内容并运行安全规则检查。",
        "instructions": "当前只检查代码中是否包含关键文本。",
        "completionMessage": "三项检查均已通过。"
      },
      "teacherNotes": {
        "purpose": "建立修改后验证习惯",
        "talkingPoints": ["检查不是猜测"],
        "observeFor": ["学生能否根据失败提示修改"]
      },
      "assistant": {
        "mode": "preset",
        "message": "逐条读取未通过的提示。",
        "hints": ["按钮需要 button 标签", "反馈需要可见文字"]
      },
      "atoms": [
        {
          "id": "lesson-01.test.rules",
          "type": "runTest",
          "title": "欢迎页完成检查",
          "required": true,
          "description": "检查页面关键部分。",
          "language": "html",
          "testMode": "contains",
          "initialCode": "<h1>欢迎来到我的创意站</h1>",
          "tests": [
            { "id": "button", "label": "包含按钮", "includes": "<button", "message": "加入按钮。" },
            { "id": "feedback", "label": "包含欢迎反馈", "includes": "欢迎", "message": "加入欢迎文字。" }
          ]
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.test.rules"]
      }
    },
    {
      "id": "lesson-01.share",
      "phase": "说",
      "title": "说出人机分工",
      "durationMinutes": 5,
      "goal": "说明 AI 生成了什么、自己修改了什么",
      "studentContent": {
        "intro": "用自己的话完成回顾。",
        "instructions": "至少写 12 个字。",
        "completionMessage": "第 01 课完成。"
      },
      "teacherNotes": {
        "purpose": "确认学生不是只点击完成",
        "talkingPoints": ["说清生成与判断"],
        "observeFor": ["能否指出具体修改"]
      },
      "assistant": {
        "mode": "preset",
        "message": "使用“AI 生成了……，我修改了……”句式。",
        "hints": ["写出标题、颜色或欢迎语中的一项"]
      },
      "atoms": [
        {
          "id": "lesson-01.share.reflection",
          "type": "textInput",
          "title": "一句话回顾",
          "required": true,
          "question": "AI 生成了什么？你修改了什么？",
          "placeholder": "AI 生成了……，我修改了……",
          "validation": { "mode": "minLength", "minLength": 12 },
          "successMessage": "表达清楚。",
          "hint": "写出一处具体修改。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-01.share.reflection"]
      }
    }
  ]
}
```

## 7. 第 06 课简化 JSON 示例

第 06 课继续复用同一 Schema 和现有原子，验证“不同课次不新增页面代码”的目标：

```json
{
  "schemaVersion": 1,
  "id": "lesson-06",
  "courseId": "vibe-coding-foundations",
  "unitId": "unit-03",
  "order": 6,
  "title": "点击之后会发生什么",
  "subtitle": "用事件连接用户动作和页面反馈",
  "durationMinutes": 90,
  "coreGoal": "理解点击事件，并为按钮添加稳定、可见的反馈。",
  "keyConcepts": ["事件", "触发", "动作", "反馈", "点击"],
  "skills": ["事件拆解", "互动设计", "故障检查"],
  "output": {
    "title": "点击互动",
    "description": "一组具有明确点击反馈的网页互动。",
    "acceptanceCriteria": ["至少一个按钮稳定触发预期结果"]
  },
  "teacherNotes": {
    "objectives": ["用“当……时，就……”表达事件"],
    "preparation": ["准备正常按钮和故障按钮案例"],
    "commonIssues": ["只写动作，不写用户可见反馈"]
  },
  "studentContent": {
    "opening": "今天让按钮真正回应你的操作。",
    "safetyNote": "代码检查为预设安全规则，不执行任意代码。",
    "completionMessage": "你完成了第一个稳定点击事件。"
  },
  "parentSummary": {
    "theme": "点击事件与互动反馈",
    "learned": "孩子能描述用户动作如何触发页面变化。",
    "artifact": "一个点击后产生明确反馈的网页互动。"
  },
  "steps": [
    {
      "id": "lesson-06.look",
      "phase": "看",
      "title": "体验四种点击反馈",
      "durationMinutes": 10,
      "goal": "发现点击前后的页面变化",
      "studentContent": {
        "intro": "观察切换文字、显示内容等反馈。",
        "instructions": "先说变化，再揭晓。",
        "completionMessage": "你找到了动作和反馈。"
      },
      "teacherNotes": {
        "purpose": "建立事件直觉",
        "talkingPoints": ["动作发生在前，反馈出现于后"],
        "observeFor": ["能否描述可见变化"]
      },
      "assistant": {
        "mode": "preset",
        "message": "比较点击前后的文字。",
        "hints": ["反馈需要被用户看见"]
      },
      "atoms": [
        {
          "id": "lesson-06.look.reveal",
          "type": "reveal",
          "title": "点击实验",
          "required": true,
          "prompt": "点击按钮后，互动中最重要的变化是什么？",
          "content": "页面根据点击事件显示了新的可见反馈。",
          "buttonLabel": "揭晓"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.look.reveal"]
      }
    },
    {
      "id": "lesson-06.explain",
      "phase": "讲",
      "title": "理解事件结构",
      "durationMinutes": 10,
      "goal": "区分触发、动作和反馈",
      "studentContent": {
        "intro": "选择正确的事件顺序。",
        "instructions": "从用户动作开始判断。",
        "completionMessage": "顺序判断正确。"
      },
      "teacherNotes": {
        "purpose": "形成事件心智模型",
        "talkingPoints": ["点击触发程序动作"],
        "observeFor": ["不要把反馈放在点击前"]
      },
      "assistant": {
        "mode": "preset",
        "message": "先问用户做了什么。",
        "hints": ["用户点击 → 程序处理 → 页面反馈"]
      },
      "atoms": [
        {
          "id": "lesson-06.explain.order",
          "type": "choice",
          "title": "事件顺序",
          "required": true,
          "question": "哪个顺序正确？",
          "options": [
            { "id": "a", "label": "页面反馈 → 用户点击 → 程序动作" },
            { "id": "b", "label": "用户点击 → 程序动作 → 页面反馈" }
          ],
          "correctOptionId": "b",
          "explanation": "点击先触发动作，动作再更新页面。",
          "incorrectMessage": "从用户第一次操作开始重新排序。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.explain.order"]
      }
    },
    {
      "id": "lesson-06.think",
      "phase": "想",
      "title": "填写互动卡",
      "durationMinutes": 15,
      "goal": "写清触发方式、页面动作和反馈结果",
      "studentContent": {
        "intro": "使用“当……时，网页就会……”句式。",
        "instructions": "至少写 12 个字。",
        "completionMessage": "互动需求已拆清楚。"
      },
      "teacherNotes": {
        "purpose": "在写代码前明确行为",
        "talkingPoints": ["一次互动只解决一个核心反馈"],
        "observeFor": ["是否包含触发和结果"]
      },
      "assistant": {
        "mode": "preset",
        "message": "先写点击哪个按钮。",
        "hints": ["再写页面显示或隐藏什么"]
      },
      "atoms": [
        {
          "id": "lesson-06.think.event-card",
          "type": "textInput",
          "title": "互动卡",
          "required": true,
          "question": "用一句话描述你的点击互动。",
          "placeholder": "当用户点击……时，网页就会……",
          "validation": { "mode": "minLength", "minLength": 12 },
          "successMessage": "互动描述清楚。",
          "hint": "同时写出触发和反馈。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.think.event-card"]
      }
    },
    {
      "id": "lesson-06.make",
      "phase": "做",
      "title": "连接点击与反馈",
      "durationMinutes": 35,
      "goal": "观察点击事件代码与页面变化",
      "studentContent": {
        "intro": "对照事件代码与预览。",
        "instructions": "找出 click 和反馈文字。",
        "completionMessage": "你找到了事件连接。"
      },
      "teacherNotes": {
        "purpose": "把事件模型连接到代码",
        "talkingPoints": ["事件决定何时执行"],
        "observeFor": ["学生能否指出反馈文字"]
      },
      "assistant": {
        "mode": "preset",
        "message": "先找 click。",
        "hints": ["再找页面更新的文字"]
      },
      "atoms": [
        {
          "id": "lesson-06.make.preview",
          "type": "codePreview",
          "title": "点击互动预览",
          "required": true,
          "description": "点击后显示挑战成功。",
          "language": "javascript",
          "code": "button.addEventListener('click', () => { message.textContent = '挑战成功'; });",
          "preview": {
            "heading": "准备好了吗？",
            "text": "点击按钮查看反馈。",
            "buttonLabel": "开始挑战",
            "accent": "#6D28D9"
          }
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.make.preview"]
      }
    },
    {
      "id": "lesson-06.test",
      "phase": "测",
      "title": "修复故障按钮",
      "durationMinutes": 15,
      "goal": "检查 click 事件和反馈文字",
      "studentContent": {
        "intro": "修复缺少事件名和成功反馈的代码。",
        "instructions": "运行安全规则检查。",
        "completionMessage": "故障按钮已修复。"
      },
      "teacherNotes": {
        "purpose": "建立事件调试的最小闭环",
        "talkingPoints": ["复现、修改、再验证"],
        "observeFor": ["是否一次只修一个问题"]
      },
      "assistant": {
        "mode": "preset",
        "message": "根据失败项逐条修改。",
        "hints": ["事件名是 click", "反馈包含“挑战成功”"]
      },
      "atoms": [
        {
          "id": "lesson-06.test.broken-button",
          "type": "runTest",
          "title": "故障按钮检查",
          "required": true,
          "description": "补齐事件与反馈。",
          "language": "javascript",
          "testMode": "contains",
          "initialCode": "button.addEventListener('', () => { message = '继续加油'; });",
          "tests": [
            { "id": "click", "label": "监听点击", "includes": "click", "message": "加入 click。" },
            { "id": "message", "label": "成功反馈", "includes": "挑战成功", "message": "加入挑战成功。" }
          ]
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.test.broken-button"]
      }
    },
    {
      "id": "lesson-06.share",
      "phase": "说",
      "title": "讲出互动逻辑",
      "durationMinutes": 5,
      "goal": "用事件句式解释自己的互动",
      "studentContent": {
        "intro": "完成“当……时，网页就会……”。",
        "instructions": "至少写 10 个字。",
        "completionMessage": "第 06 课完成。"
      },
      "teacherNotes": {
        "purpose": "检查事件理解",
        "talkingPoints": ["动作和反馈都要具体"],
        "observeFor": ["不能只说“按钮能用”"]
      },
      "assistant": {
        "mode": "preset",
        "message": "写出具体按钮和具体结果。",
        "hints": ["例如显示文字或展开内容"]
      },
      "atoms": [
        {
          "id": "lesson-06.share.reflection",
          "type": "textInput",
          "title": "事件表达",
          "required": true,
          "question": "你的互动是怎样触发的？",
          "placeholder": "当……时，网页就会……",
          "validation": { "mode": "minLength", "minLength": 10 },
          "successMessage": "事件与反馈表达清楚。",
          "hint": "写清点击和结果。"
        }
      ],
      "completion": {
        "mode": "allRequired",
        "requiredAtomIds": ["lesson-06.share.reflection"]
      }
    }
  ]
}
```

## 8. 内容发布与兼容规则

- 每个 JSON 修改都必须通过 Zod 单文件验证和全课程引用完整性验证。
- Schema 破坏性变化必须提升 `schemaVersion` 并提供迁移，不直接修改旧版本含义。
- 组件删除前先扫描内容引用；仍被任一课次引用时不得删除。
- 第 01、06 课是已完成样板；迁移到工具宿主和 ProjectDocument 时必须提供旧互动进度兼容映射。
- 其余 11 课按课程工具分组接入，不得为凑齐 13 课复制占位内容。
- `teacherNotes` 不展示给学生，`parentSummary` 不展示复杂代码；这是展示边界，不是安全权限替代。
- ProjectDocument 结构由项目 Schema 管理，不嵌入 Lesson JSON；Lesson 只声明字段路径和工具绑定。
