import { z } from "zod";

const isoDate = z.iso.datetime();
const valueSchema = z.union([z.string(), z.number(), z.boolean()]);

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
  type: z.enum(["section", "heading", "text", "image", "button", "input", "result", "container"]),
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
  type: z.enum(["code", "preview", "cover", "document", "lesson-binding"]),
  name: z.string().min(1),
  content: z.string(),
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
});

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
    components: z.array(componentSchema),
    interactions: z.array(interactionSchema),
    inputs: z.array(
      z.object({
        id: z.string().min(1),
        componentId: z.string().min(1),
        name: z.string().min(1),
        value: z.string(),
      }),
    ),
    conditions: z.array(
      z.object({
        id: z.string().min(1),
        expression: z.string(),
        whenTrue: z.string(),
        whenFalse: z.string(),
      }),
    ),
    state: z.array(
      z.object({
        id: z.string().min(1),
        key: z.string().min(1),
        value: valueSchema,
        persistence: z.enum(["session", "local"]),
      }),
    ),
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
    }),
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
  "scope",
  "pages",
  "structure",
  "styles",
  "components",
  "interactions",
  "inputs",
  "conditions",
  "state",
  "tests",
  "artifacts",
  "decisions",
  "feedback",
  "versions",
  "publication",
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
    scope: { mustHave: [], shouldHave: [], outOfScope: [], coreFlow: [] },
    pages: [{ id: "page-home", name: "首页", slug: "home", order: 0, structureRootIds: ["node-title", "node-message", "node-action"] }],
    structure: [
      { id: "node-title", pageId: "page-home", parentId: null, type: "heading", order: 0, content: title },
      { id: "node-message", pageId: "page-home", parentId: null, type: "text", order: 1, content: "这里会展示你的应用提示。" },
      { id: "node-action", pageId: "page-home", parentId: null, type: "button", order: 2, content: "启动任务" },
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
    components: [
      { id: "component-action", pageId: "page-home", type: "button", name: "主操作按钮", props: { label: "启动任务" } },
    ],
    interactions: [],
    inputs: [],
    conditions: [],
    state: [],
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
    },
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
