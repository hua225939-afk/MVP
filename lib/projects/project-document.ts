import { z } from "zod";

const isoDate = z.iso.datetime();
const valueSchema = z.union([z.string(), z.number(), z.boolean()]);

const creativeIntentSchema = z.object({
  appIntent: z.string(),
  audience: z.string(),
  scenario: z.string(),
  problem: z.string(),
  coreFunctions: z.array(z.string()),
  possibleInputs: z.array(z.string()),
  possibleOutputs: z.array(z.string()),
  visualStyle: z.string(),
  uncertainties: z.array(z.string()),
});

const inspirationSourceSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["learning", "campus", "interest", "habit", "family", "community"]),
  title: z.string().min(1),
  detail: z.string(),
  imageData: z.string(),
  hotspotId: z.string().nullable(),
  marker: z.enum(["like", "curious", "solve", "favorite"]),
});

const interestNodeSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["learning", "campus", "interest", "habit", "family", "community"]),
  label: z.string().min(1),
  detail: z.string(),
  imageData: z.string(),
  sourceId: z.string().nullable(),
  role: z.enum(["like", "problem", "audience"]),
  color: z.string(),
  icon: z.string(),
});

const canvasElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["stroke", "sticker", "note", "arrow", "shape", "image"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
  text: z.string(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
});

const pageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  order: z.number().int().nonnegative(),
  structureRootIds: z.array(z.string()),
});

const structureNodeSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  parentId: z.string().nullable(),
  type: z.enum(["section", "heading", "text", "image", "button", "input", "result", "container", "card", "list", "navigation", "alert", "progress", "modal", "option"]),
  htmlTag: z.enum(["header", "main", "section", "footer", "nav", "article", "div", "h1", "h2", "p", "img", "button", "input", "ul", "li"]).optional(),
  order: z.number().int().nonnegative(),
  content: z.string(),
});

const componentSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  props: z.record(z.string(), valueSchema),
});

const interactionSchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  trigger: z.enum(["click", "input", "change", "submit"]),
  action: z.enum(["message", "color", "counter", "show", "hide"]),
  config: z.record(z.string(), valueSchema),
});

const testSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["pending", "pass", "fail"]),
  projectRevision: z.number().int().nonnegative(),
  toolId: z.string().nullable(),
  message: z.string(),
  attempts: z.number().int().nonnegative(),
  updatedAt: isoDate,
});

const artifactSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["code", "preview", "cover", "document", "lesson-binding", "screenshot"]),
  name: z.string().min(1),
  content: z.string(),
  visibility: z.enum(["private", "public"]).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const versionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  revision: z.number().int().nonnegative(),
  snapshot: z.string().min(2),
  createdAt: isoDate,
  coverArtifactId: z.string().nullable().default(null),
  screenshotArtifactId: z.string().nullable().default(null),
  changes: z.array(z.string()).default([]),
  testSummary: z.string().default(""),
  aiSuggestions: z.array(z.string()).default([]),
  studentDecisions: z.array(z.string()).default([]),
  peerFeedback: z.array(z.string()).default([]),
});

const appFlowSchema = z.object({
  nodes: z.array(z.object({
    pageId: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    enabled: z.boolean(),
  })),
  connections: z.array(z.object({
    id: z.string().min(1),
    fromPageId: z.string().min(1),
    toPageId: z.string().min(1),
    kind: z.enum(["next", "return", "restart"]),
  })),
  startPageId: z.string().nullable(),
  coreEntryPageId: z.string().nullable(),
  resultPageId: z.string().nullable(),
  simulationRoles: z.array(z.string()),
  completedVoyages: z.number().int().nonnegative(),
  experienceChecks: z.array(z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    finding: z.string(),
    suggestion: z.string(),
    studentResponse: z.enum(["agree", "disagree", "modify", "defer"]).nullable(),
    studentNote: z.string(),
  })),
}).default({
  nodes: [],
  connections: [],
  startPageId: null,
  coreEntryPageId: null,
  resultPageId: null,
  simulationRoles: [],
  completedVoyages: 0,
  experienceChecks: [],
});

const testScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  task: z.string(),
  pageIds: z.array(z.string()),
  steps: z.array(z.string()),
  status: z.enum(["draft", "pass", "fail"]),
  runCount: z.number().int().nonnegative(),
  readOnly: z.boolean(),
});

const bugAnnotationSchema = z.object({
  id: z.string().min(1),
  screenshotArtifactId: z.string().min(1),
  pageId: z.string().min(1),
  shape: z.enum(["circle", "arrow", "text"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  text: z.string(),
  problemType: z.enum(["visual", "interaction", "logic", "content"]),
});

const bugReportSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["visual", "interaction", "logic", "content"]),
  severity: z.enum(["low", "medium", "high", "blocker"]),
  beforeActions: z.array(z.string()),
  afterActions: z.array(z.string()),
  reproSteps: z.array(z.string()),
  expected: z.string(),
  actual: z.string(),
  annotationIds: z.array(z.string()),
  componentIds: z.array(z.string()),
  codeExcerpt: z.string(),
  testLog: z.array(z.string()),
  status: z.enum(["open", "fixing", "resolved"]),
});

const aiDebugDraftSchema = z.object({
  id: z.string().min(1),
  bugReportId: z.string().min(1),
  mode: z.enum(["live", "demo"]),
  disclaimer: z.string().min(1),
  inputSummary: z.array(z.string()),
  suggestions: z.array(z.object({
    id: z.string().min(1),
    cause: z.string(),
    checkLocation: z.string(),
    fix: z.string(),
    risk: z.string(),
    retest: z.string(),
  })).min(2),
});

const studentFixSchema = z.object({
  id: z.string().min(1),
  draftId: z.string().min(1),
  suggestionId: z.string().min(1),
  modifiedPlan: z.string().min(1),
  patchSummary: z.string(),
  diff: z.string(),
  beforeTestStatus: z.enum(["pending", "pass", "fail"]),
  afterTestStatus: z.enum(["pending", "pass", "fail"]),
  resolved: z.boolean(),
});

const peerReviewSchema = z.object({
  id: z.string().min(1),
  reviewer: z.string().min(1),
  taskId: z.string().min(1),
  pageId: z.string().min(1),
  readOnly: z.literal(true),
  screenshotArtifactId: z.string().nullable(),
  annotationIds: z.array(z.string()),
  note: z.string(),
  emotion: z.enum(["happy", "neutral", "confused", "frustrated"]),
  favorite: z.string(),
  stuckAt: z.string(),
  suggestion: z.string(),
  severity: z.enum(["low", "medium", "high", "blocker"]),
  problemType: z.enum(["visual", "interaction", "logic", "content", "experience"]),
  cluster: z.string(),
  aiSummary: z.string(),
  studentSummary: z.string(),
});

const experienceCurveSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  points: z.array(z.object({
    phase: z.enum(["start", "action", "result"]),
    emotion: z.number().int().min(-2).max(2),
    note: z.string(),
  })).length(3),
});

const storyMarkerSchema = z.enum([
  "most-important",
  "ai-helped",
  "ai-rejected",
  "peer-changed",
]);

const projectStorySchema = z.object({
  nodes: z.array(z.object({
    id: z.string().min(1),
    source: z.enum([
      "interest-map",
      "intent-draft",
      "student-intent",
      "page-sketch",
      "visual-theme",
      "component",
      "interaction",
      "bug",
      "peer-feedback",
      "version",
      "student-note",
    ]),
    title: z.string().min(1),
    summary: z.string(),
    selected: z.boolean(),
    order: z.number().int().nonnegative(),
    screenshotArtifactId: z.string().nullable(),
    note: z.string(),
    markers: z.array(storyMarkerSchema),
  })),
  updatedAt: isoDate.nullable(),
}).default({ nodes: [], updatedAt: null });

const launchVisualsSchema = z.object({
  themeId: z.string(),
  customThemeName: z.string(),
  background: z.string(),
  textColor: z.string(),
  layoutMode: z.enum(["template", "free"]),
  layoutId: z.string(),
  title: z.string(),
  icon: z.string(),
  keywords: z.array(z.string()),
  coverArtifactId: z.string().nullable(),
  screenshots: z.array(z.object({
    artifactId: z.string().min(1),
    order: z.number().int().nonnegative(),
    cropX: z.number().min(0).max(100),
    cropY: z.number().min(0).max(100),
    zoom: z.number().min(1).max(3),
    caption: z.string(),
  })),
  blocks: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(["cover", "feature", "version", "screenshot"]),
    title: z.string(),
    text: z.string(),
    order: z.number().int().nonnegative(),
  })),
  previewDevice: z.enum(["desktop", "tablet"]),
}).default({
  themeId: "cosmic",
  customThemeName: "",
  background: "#F4F0FF",
  textColor: "#20183A",
  layoutMode: "template",
  layoutId: "story-first",
  title: "",
  icon: "✦",
  keywords: [],
  coverArtifactId: null,
  screenshots: [],
  blocks: [],
  previewDevice: "desktop",
});

const presentationSectionIdSchema = z.enum([
  "one-line",
  "audience",
  "problem",
  "features",
  "experience",
  "upgrade",
  "ai-role",
  "student-decision",
]);

const presentationDraftSchema = z.object({
  generatedAt: isoDate.nullable(),
  sourceRevision: z.number().int().nonnegative(),
  disclaimer: z.string(),
  sections: z.array(z.object({
    id: presentationSectionIdSchema,
    label: z.string().min(1),
    content: z.string(),
  })),
  minuteScript: z.string(),
}).default({
  generatedAt: null,
  sourceRevision: 0,
  disclaimer: "",
  sections: [],
  minuteScript: "",
});

const studentPresentationSchema = z.object({
  sections: z.array(z.object({
    id: presentationSectionIdSchema,
    label: z.string().min(1),
    aiOriginal: z.string(),
    studentDraft: z.string(),
    finalText: z.string(),
    included: z.boolean(),
    order: z.number().int().nonnegative(),
  })),
  minuteScript: z.object({
    aiOriginal: z.string(),
    studentDraft: z.string(),
    finalText: z.string(),
  }),
  finalizedAt: isoDate.nullable(),
}).default({
  sections: [],
  minuteScript: { aiOriginal: "", studentDraft: "", finalText: "" },
  finalizedAt: null,
});

const demoScriptSchema = z.object({
  stages: z.array(z.object({
    id: z.enum(["opening", "problem", "core-action", "result", "upgrade", "ai-student", "closing"]),
    label: z.string().min(1),
    script: z.string(),
    seconds: z.number().int().min(0).max(60),
    assetType: z.enum(["page", "screenshot", "live"]),
    assetId: z.string().nullable(),
    order: z.number().int().nonnegative(),
  })),
  rehearsal: z.object({
    durationSeconds: z.number().int().nonnegative(),
    overTime: z.boolean(),
    testedAt: isoDate.nullable(),
  }),
}).default({
  stages: [],
  rehearsal: { durationSeconds: 0, overTime: false, testedAt: null },
});

const finalVersionSchema = z.object({
  versionId: z.string().min(1),
  sourceVersionId: z.string().nullable(),
  label: z.string().min(1),
  summary: z.string(),
  createdAt: isoDate,
}).nullable().default(null);

export const projectDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    projectId: z.string().min(1),
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    title: z.string().min(1),
    audience: z.object({
      primary: z.string(),
      needs: z.array(z.string()),
    }),
    scenario: z.object({
      context: z.string(),
      problem: z.string(),
    }),
    intent: z.object({
      statement: z.string(),
      expectedOutcome: z.string(),
    }),
    inspirationSources: z.array(inspirationSourceSchema),
    interestMap: z.object({
      nodes: z.array(interestNodeSchema),
      links: z.array(
        z.object({
          id: z.string().min(1),
          nodeIds: z.array(z.string()).min(2).max(3),
          statement: z.string(),
        }),
      ),
    }),
    sketch: z.object({
      compressedImage: z.string().nullable(),
      elements: z.array(canvasElementSchema),
      updatedAt: isoDate.nullable(),
    }),
    keywords: z.array(z.string()),
    aiDraft: creativeIntentSchema.nullable(),
    studentRevision: creativeIntentSchema.nullable(),
    finalIntent: creativeIntentSchema.nullable(),
    aiMode: z.enum(["live", "demo"]).nullable(),
    aiProvenance: z.object({
      provider: z.string(),
      model: z.string(),
      generatedAt: isoDate,
      disclaimer: z.string(),
    }).nullable(),
    scope: z.object({
      mustHave: z.array(z.string()),
      shouldHave: z.array(z.string()),
      outOfScope: z.array(z.string()),
      coreFlow: z.array(z.string()),
    }),
    pages: z.array(pageSchema),
    structure: z.array(structureNodeSchema),
    styles: z.object({
      themes: z.array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          tokens: z.record(z.string(), z.string()),
        }),
      ),
      selectedThemeId: z.string().nullable(),
      tokens: z.record(z.string(), z.string()),
    }),
    styleTokens: z.object({
      primary: z.string(),
      secondary: z.string(),
      background: z.string(),
      text: z.string(),
      fontFamily: z.string(),
      fontScale: z.array(z.string()),
      spacing: z.string(),
      radius: z.string(),
      shadow: z.string(),
      buttonStyle: z.string(),
      border: z.string(),
      pageWidth: z.string(),
    }).default({
      primary: "#7C3AED",
      secondary: "#2563EB",
      background: "#F7F7FB",
      text: "#172033",
      fontFamily: "system-ui",
      fontScale: ["14px", "18px", "32px"],
      spacing: "16px",
      radius: "16px",
      shadow: "0 8px 24px rgba(23,32,51,.12)",
      buttonStyle: "solid",
      border: "1px solid #E5E7EB",
      pageWidth: "960px",
    }),
    moodboard: z.object({
      items: z.array(z.object({
        id: z.string().min(1),
        source: z.enum(["local", "upload", "unit-one"]),
        title: z.string().min(1),
        imageData: z.string(),
        colors: z.array(z.string()),
        favorite: z.boolean(),
        selected: z.boolean(),
      })),
      keywords: z.array(z.string()),
      fontMood: z.string(),
      shape: z.string(),
      radius: z.string(),
      spacing: z.string(),
      buttonFeel: z.string(),
      reason: z.string(),
    }).default({
      items: [],
      keywords: [],
      fontMood: "",
      shape: "",
      radius: "",
      spacing: "",
      buttonFeel: "",
      reason: "",
    }),
    components: z.array(componentSchema),
    customComponentBriefs: z.array(z.object({
      id: z.string().min(1),
      pageId: z.string().min(1),
      name: z.string().min(1),
      purpose: z.string(),
      sketch: z.string(),
      annotations: z.array(z.object({
        id: z.string().min(1),
        kind: z.enum(["input", "button", "result", "note"]),
        label: z.string(),
      })),
      referenceImages: z.array(z.string()),
      keywords: z.array(z.string()),
      contentAreas: z.array(z.string()),
      editableProps: z.array(z.string()),
      interactionNeeds: z.array(z.string()),
      safeComposition: z.array(z.string()),
      status: z.enum(["draft", "student-revised", "confirmed"]),
    })).default([]),
    aiDrafts: z.array(z.object({
      id: z.string().min(1),
      lessonId: z.string().min(1),
      kind: z.enum(["structure", "styleTokens", "componentSpec"]),
      payload: z.string(),
      generatedAt: isoDate,
      disclaimer: z.string(),
    })).default([]),
    studentRevisions: z.array(z.object({
      id: z.string().min(1),
      draftId: z.string().min(1),
      lessonId: z.string().min(1),
      kind: z.enum(["structure", "styleTokens", "componentSpec"]),
      payload: z.string(),
      reason: z.string(),
      confirmedAt: isoDate,
    })).default([]),
    interactions: z.array(interactionSchema),
    inputs: z.array(
      z.object({
        id: z.string().min(1),
        componentId: z.string().min(1),
        name: z.string().min(1),
        value: z.string(),
        inputType: z.enum(["text", "number", "select"]).optional(),
        label: z.string().optional(),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        maxLength: z.number().int().positive().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        options: z.array(z.string()).optional(),
        errorMessage: z.string().optional(),
        resultTemplate: z.string().optional(),
      }),
    ),
    conditions: z.array(
      z.object({
        id: z.string().min(1),
        expression: z.string(),
        whenTrue: z.string(),
        whenFalse: z.string(),
        inputId: z.string().optional(),
        operator: z.enum(["lt", "lte", "eq", "gte", "gt", "includes"]).optional(),
        compareValue: valueSchema.optional(),
        order: z.number().int().nonnegative().optional(),
      }),
    ),
    state: z.array(
      z.object({
        id: z.string().min(1),
        key: z.string().min(1),
        value: valueSchema,
        persistence: z.enum(["session", "local"]),
        kind: z.enum(["counter", "check", "favorite", "recent-result"]).optional(),
        label: z.string().optional(),
      }),
    ),
    appFlow: appFlowSchema,
    testScenarios: z.array(testScenarioSchema).default([]),
    bugAnnotations: z.array(bugAnnotationSchema).default([]),
    bugReports: z.array(bugReportSchema).default([]),
    aiDebugDrafts: z.array(aiDebugDraftSchema).default([]),
    studentFixes: z.array(studentFixSchema).default([]),
    peerReviews: z.array(peerReviewSchema).default([]),
    experienceCurves: z.array(experienceCurveSchema).default([]),
    projectStory: projectStorySchema,
    launchVisuals: launchVisualsSchema,
    presentationDraft: presentationDraftSchema,
    studentPresentation: studentPresentationSchema,
    demoScript: demoScriptSchema,
    tests: z.array(testSchema),
    artifacts: z.array(artifactSchema),
    decisions: z.array(
      z.object({
        id: z.string().min(1),
        lessonId: z.string().nullable(),
        toolId: z.string().nullable(),
        title: z.string().min(1),
        reason: z.string(),
        suggestedBy: z.enum(["student", "local-assistant", "teacher"]),
        createdAt: isoDate,
      }),
    ),
    feedback: z.array(
      z.object({
        id: z.string().min(1),
        author: z.string().min(1),
        content: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]),
        status: z.enum(["open", "accepted", "declined"]),
        createdAt: isoDate,
      }),
    ),
    versions: z.array(versionSchema),
    publication: z.object({
      status: z.enum(["not_ready", "ready", "published_demo", "published"]),
      versionId: z.string().nullable(),
      title: z.string(),
      description: z.string(),
      coverArtifactId: z.string().nullable(),
      visibility: z.enum(["private", "class", "public"]),
      safetyChecks: z.array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          status: z.enum(["pending", "pass", "fail"]),
          message: z.string(),
        }),
      ),
      url: z.string().nullable(),
      qrCodeArtifactId: z.string().nullable(),
      publishedAt: isoDate.nullable(),
      oneLine: z.string().default(""),
      audience: z.string().default(""),
      problem: z.string().default(""),
      featureTags: z.array(z.string()).default([]),
      category: z.string().default("其他"),
      experienceInstructions: z.string().default(""),
      featuredPageIds: z.array(z.string()).default([]),
      storyNodeIds: z.array(z.string()).default([]),
      learningReflection: z.string().default(""),
    }),
    finalVersion: finalVersionSchema,
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
export type ProjectArtifact = ProjectDocument["artifacts"][number];
export type ProjectTest = ProjectDocument["tests"][number];
export type ProjectVersion = ProjectDocument["versions"][number];
export type ProjectTopLevelField = Exclude<keyof ProjectDocument, "schemaVersion" | "revision" | "projectId" | "studentId" | "courseId" | "createdAt" | "updatedAt">;

export const PROJECT_EDITABLE_FIELDS = [
  "title",
  "audience",
  "scenario",
  "intent",
  "inspirationSources",
  "interestMap",
  "sketch",
  "keywords",
  "aiDraft",
  "studentRevision",
  "finalIntent",
  "aiMode",
  "aiProvenance",
  "scope",
  "pages",
  "structure",
  "styles",
  "styleTokens",
  "moodboard",
  "components",
  "customComponentBriefs",
  "aiDrafts",
  "studentRevisions",
  "interactions",
  "inputs",
  "conditions",
  "state",
  "appFlow",
  "testScenarios",
  "bugAnnotations",
  "bugReports",
  "aiDebugDrafts",
  "studentFixes",
  "peerReviews",
  "experienceCurves",
  "projectStory",
  "launchVisuals",
  "presentationDraft",
  "studentPresentation",
  "demoScript",
  "tests",
  "artifacts",
  "decisions",
  "feedback",
  "versions",
  "publication",
  "finalVersion",
] as const satisfies readonly ProjectTopLevelField[];

export const PROJECT_SCHEMA_VERSION = 1;
export const DEFAULT_PROJECT_ID = "vibe-foundations-student-an";
export const DEFAULT_STUDENT_ID = "student-an";
export const DEFAULT_COURSE_ID = "vibe-coding-foundations";

export function createDefaultProject(
  projectId = DEFAULT_PROJECT_ID,
  now = new Date().toISOString(),
  title = "我的第一个应用",
): ProjectDocument {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    revision: 0,
    projectId,
    studentId: DEFAULT_STUDENT_ID,
    courseId: DEFAULT_COURSE_ID,
    title,
    audience: { primary: "", needs: [] },
    scenario: { context: "", problem: "" },
    intent: { statement: "", expectedOutcome: "" },
    inspirationSources: [],
    interestMap: { nodes: [], links: [] },
    sketch: { compressedImage: null, elements: [], updatedAt: null },
    keywords: [],
    aiDraft: null,
    studentRevision: null,
    finalIntent: null,
    aiMode: null,
    aiProvenance: null,
    scope: { mustHave: [], shouldHave: [], outOfScope: [], coreFlow: [] },
    pages: [{ id: "page-home", name: "首页", slug: "home", order: 0, structureRootIds: ["node-title", "node-message", "node-action"] }],
    structure: [
      { id: "node-title", pageId: "page-home", parentId: null, type: "heading", htmlTag: "h1", order: 0, content: title },
      { id: "node-message", pageId: "page-home", parentId: null, type: "text", htmlTag: "p", order: 1, content: "这里会展示你的应用提示。" },
      { id: "node-action", pageId: "page-home", parentId: null, type: "button", htmlTag: "button", order: 2, content: "启动任务" },
    ],
    styles: {
      themes: [
        {
          id: "planet-purple",
          name: "造物紫",
          tokens: { accent: "#7C3AED", surface: "#FFFFFF", text: "#172033" },
        },
      ],
      selectedThemeId: "planet-purple",
      tokens: { accent: "#7C3AED", surface: "#FFFFFF", text: "#172033" },
    },
    styleTokens: {
      primary: "#7C3AED",
      secondary: "#2563EB",
      background: "#F7F7FB",
      text: "#172033",
      fontFamily: "system-ui",
      fontScale: ["14px", "18px", "32px"],
      spacing: "16px",
      radius: "16px",
      shadow: "0 8px 24px rgba(23,32,51,.12)",
      buttonStyle: "solid",
      border: "1px solid #E5E7EB",
      pageWidth: "960px",
    },
    moodboard: {
      items: [],
      keywords: [],
      fontMood: "",
      shape: "",
      radius: "",
      spacing: "",
      buttonFeel: "",
      reason: "",
    },
    components: [
      { id: "component-action", pageId: "page-home", type: "button", name: "主操作按钮", props: { label: "启动任务" } },
    ],
    customComponentBriefs: [],
    aiDrafts: [],
    studentRevisions: [],
    interactions: [],
    inputs: [],
    conditions: [],
    state: [],
    appFlow: {
      nodes: [],
      connections: [],
      startPageId: null,
      coreEntryPageId: null,
      resultPageId: null,
      simulationRoles: [],
      completedVoyages: 0,
      experienceChecks: [],
    },
    testScenarios: [],
    bugAnnotations: [],
    bugReports: [],
    aiDebugDrafts: [],
    studentFixes: [],
    peerReviews: [],
    experienceCurves: [],
    projectStory: { nodes: [], updatedAt: null },
    launchVisuals: {
      themeId: "cosmic",
      customThemeName: "",
      background: "#F4F0FF",
      textColor: "#20183A",
      layoutMode: "template",
      layoutId: "story-first",
      title,
      icon: "✦",
      keywords: [],
      coverArtifactId: null,
      screenshots: [],
      blocks: [],
      previewDevice: "desktop",
    },
    presentationDraft: {
      generatedAt: null,
      sourceRevision: 0,
      disclaimer: "",
      sections: [],
      minuteScript: "",
    },
    studentPresentation: {
      sections: [],
      minuteScript: { aiOriginal: "", studentDraft: "", finalText: "" },
      finalizedAt: null,
    },
    demoScript: {
      stages: [],
      rehearsal: { durationSeconds: 0, overTime: false, testedAt: null },
    },
    tests: [],
    artifacts: [],
    decisions: [],
    feedback: [],
    versions: [],
    publication: {
      status: "not_ready",
      versionId: null,
      title: "",
      description: "",
      coverArtifactId: null,
      visibility: "private",
      safetyChecks: [],
      url: null,
      qrCodeArtifactId: null,
      publishedAt: null,
      oneLine: "",
      audience: "",
      problem: "",
      featureTags: [],
      category: "其他",
      experienceInstructions: "",
      featuredPageIds: [],
      storyNodeIds: [],
      learningReflection: "",
    },
    finalVersion: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function migrateProjectDocument(
  input: unknown,
  now = new Date().toISOString(),
): ProjectDocument {
  const current = projectDocumentSchema.safeParse(input);
  if (current.success) return current.data;

  if (!input || typeof input !== "object") {
    throw new Error("项目数据不是有效对象");
  }
  const legacy = input as Record<string, unknown>;
  if (
    legacy.schemaVersion !== undefined &&
    legacy.schemaVersion !== 0 &&
    legacy.schemaVersion !== 1
  ) {
    throw new Error("项目数据版本不受支持");
  }
  const projectId =
    typeof legacy.projectId === "string"
      ? legacy.projectId
      : typeof legacy.id === "string"
        ? legacy.id
        : DEFAULT_PROJECT_ID;
  const title =
    typeof legacy.title === "string"
      ? legacy.title
      : typeof legacy.name === "string"
        ? legacy.name
        : "迁移后的应用";
  const migrated = createDefaultProject(projectId, now, title);
  const source = legacy as Partial<ProjectDocument>;
  for (const field of PROJECT_EDITABLE_FIELDS) {
    if (source[field] !== undefined) {
      (migrated as unknown as Record<string, unknown>)[field] = source[field];
    }
  }
  const legacyCode = [legacy.html, legacy.css, legacy.js]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join("\n\n");
  if (legacyCode) {
    migrated.artifacts.push({
      id: "legacy-code",
      type: "code",
      name: "迁移代码",
      content: legacyCode,
      createdAt: now,
      updatedAt: now,
    });
  }
  return projectDocumentSchema.parse(migrated);
}

export function createProjectSnapshot(project: ProjectDocument) {
  const snapshot = { ...project, versions: [] };
  return JSON.stringify(snapshot);
}

export function getProjectStateValue(
  project: ProjectDocument,
  key: string,
) {
  return project.state.find((item) => item.key === key)?.value;
}

export function setProjectStateValue(
  project: ProjectDocument,
  key: string,
  value: string | number | boolean,
) {
  const existing = project.state.find((item) => item.key === key);
  return [
    ...project.state.filter((item) => item.key !== key),
    {
      id: existing?.id ?? `state-${key.replaceAll(/[^a-zA-Z0-9-]/g, "-")}`,
      key,
      value,
      persistence: existing?.persistence ?? ("local" as const),
    },
  ];
}

export function restoreProjectSnapshot(
  project: ProjectDocument,
  snapshot: string,
  now = new Date().toISOString(),
) {
  const restored = migrateProjectDocument(JSON.parse(snapshot), now);
  return projectDocumentSchema.parse({
    ...restored,
    projectId: project.projectId,
    studentId: project.studentId,
    courseId: project.courseId,
    versions: project.versions,
    revision: project.revision + 1,
    createdAt: project.createdAt,
    updatedAt: now,
  });
}
