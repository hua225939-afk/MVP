import type { Lesson } from "../lesson-schema.ts";
import type {
  InteractionProgress,
  LessonProgress,
} from "../progress-storage.ts";
import { parseTaskBuilderPayload } from "../task-builder-logic.ts";
import {
  type ProjectArtifact,
  type ProjectDocument,
} from "./project-document.ts";
import {
  getBrowserProjectRepository,
  type ProjectPatch,
} from "./project-repository.ts";
import { getCourseTool } from "../tools/course-tool-registry.ts";

const lessonToolIds: Record<string, string> = {
  "lesson-01": "intent-canvas",
  "lesson-06": "click-event",
};

function artifact(
  id: string,
  type: ProjectArtifact["type"],
  name: string,
  content: string,
  now: string,
  existing?: ProjectArtifact,
): ProjectArtifact {
  return {
    id,
    type,
    name,
    content,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function upsertArtifacts(
  current: ProjectArtifact[],
  incoming: ProjectArtifact[],
) {
  const ids = new Set(incoming.map((item) => item.id));
  return [...current.filter((item) => !ids.has(item.id)), ...incoming];
}

function text(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join("、") : value ?? "";
}

function list(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function buildLessonPatch(
  lessonId: string,
  progress: LessonProgress,
  project: ProjectDocument,
  now: string,
): ProjectPatch | null {
  const toolId = lessonToolIds[lessonId];
  const definition = toolId ? getCourseTool(toolId) : null;
  if (!definition) return null;

  const builderId = `${lessonId}.make.builder`;
  const archiveId = `${lessonId}.share.archive`;
  const builderProgress = progress.interactions[builderId];
  const archiveProgress = progress.interactions[archiveId];
  const builder = parseTaskBuilderPayload(builderProgress?.value);
  const archive = parseTaskBuilderPayload(archiveProgress?.value);
  const bindings = [builderId, archiveId].flatMap((id) => {
    const value = progress.interactions[id]?.value;
    if (typeof value !== "string") return [];
    const existing = project.artifacts.find((item) => item.id === id);
    return [
      artifact(id, "lesson-binding", `${lessonId} 课程同步数据`, value, now, existing),
    ];
  });
  const codeArtifact = builder?.generatedCode
    ? artifact(
        `${lessonId}.generated-code`,
        "code",
        `${lessonId} 生成代码`,
        builder.generatedCode,
        now,
        project.artifacts.find((item) => item.id === `${lessonId}.generated-code`),
      )
    : null;
  const artifacts = upsertArtifacts(
    project.artifacts,
    codeArtifact ? [...bindings, codeArtifact] : bindings,
  );
  const tests = project.tests.map((item) =>
    item.toolId === toolId && item.status !== "pending"
      ? {
          ...item,
          status: "pending" as const,
          message: "上游课程数据已修改，请重新测试",
          updatedAt: now,
        }
      : item,
  );
  const decisionId = `decision-${lessonId}-builder`;
  const decisions =
    builderProgress?.completed &&
    !project.decisions.some((item) => item.id === decisionId)
      ? [
          ...project.decisions,
          {
            id: decisionId,
            lessonId,
            toolId,
            title:
              lessonId === "lesson-01"
                ? "确定首次应用方向"
                : "安装点击事件",
            reason:
              lessonId === "lesson-01"
                ? "保存第 1 课结构化创造结果"
                : "保存第 6 课触发—动作—反馈配置",
            suggestedBy: "student" as const,
            createdAt: now,
          },
        ]
      : project.decisions;

  if (lessonId === "lesson-01") {
    const fields = builder?.fields ?? {};
    const archiveFields = archive?.fields ?? {};
    const title = text(fields["app-name"]) || project.title;
    return {
      projectId: project.projectId,
      baseRevision: project.revision,
      source: "lesson",
      lessonId,
      toolId,
      allowedFields: [...definition.outputFields, "artifacts", "decisions"],
      changes: {
        title,
        audience: {
          primary: text(archiveFields["archive-audience"]) || project.audience.primary,
          needs: project.audience.needs,
        },
        scenario: {
          context: text(fields.direction) || project.scenario.context,
          problem: text(archiveFields["archive-feature"]) || project.scenario.problem,
        },
        intent: {
          statement: text(fields["prompt-text"]) || project.intent.statement,
          expectedOutcome: text(fields["page-title"]) || project.intent.expectedOutcome,
        },
        artifacts,
        decisions,
      },
      createdAt: now,
    };
  }

  const fields = builder?.fields ?? {};
  const effects = list(fields.effects);
  const interaction = {
    id: "interaction-primary-click",
    componentId: "component-action",
    trigger: "click" as const,
    action: (effects.includes("counter")
      ? "counter"
      : effects.includes("color")
        ? "color"
        : "message") as "counter" | "color" | "message",
    config: {
      task: text(fields["event-task"]),
      effects: effects.join(","),
      feedback: text(fields["feedback-text"]),
      accent: text(fields["event-color"]),
      startValue: Number(text(fields["start-value"])) || 0,
    },
  };
  return {
    projectId: project.projectId,
    baseRevision: project.revision,
    source: "lesson",
    lessonId,
    toolId,
    allowedFields: [...definition.outputFields, "decisions"],
    changes: {
      interactions: builder
        ? [
            ...project.interactions.filter((item) => item.id !== interaction.id),
            interaction,
          ]
        : project.interactions,
      artifacts,
      tests,
      decisions,
    },
    createdAt: now,
  };
}

export function syncLessonProgressToProject(
  lessonId: string,
  progress: LessonProgress,
) {
  const repository = getBrowserProjectRepository();
  if (!repository || !lessonToolIds[lessonId]) return null;
  const existing = repository.getActiveProject();
  if (!existing) return null;
  if (existing && existing.updatedAt > progress.updatedAt) return existing;
  const project = existing;
  const patch = buildLessonPatch(
    lessonId,
    progress,
    project,
    new Date().toISOString(),
  );
  if (!patch) return project;
  const hasChanges = Object.entries(patch.changes).some(
    ([field, value]) =>
      JSON.stringify(project[field as keyof ProjectDocument]) !==
      JSON.stringify(value),
  );
  if (!hasChanges) return project;
  const saved = repository.applyPatch(project.projectId, patch);
  if (
    lessonId === "lesson-01" &&
    progress.interactions["lesson-01.make.builder"]?.completed &&
    saved.versions.length === 0
  ) {
    return repository.createVersion(
      project.projectId,
      "首次项目快照",
      "第 1 课创建主项目",
    );
  }
  return saved;
}

function updatePayload(
  progress: InteractionProgress | undefined,
  fields: Record<string, string | string[]>,
  generatedCode: string,
  now: string,
): InteractionProgress | undefined {
  if (!progress || typeof progress.value !== "string") return progress;
  const current = parseTaskBuilderPayload(progress.value);
  if (!current) return progress;
  return {
    ...progress,
    value: JSON.stringify({
      ...current,
      fields: { ...current.fields, ...fields },
      generatedCode: generatedCode || current.generatedCode,
      savedAt: now,
    }),
    updatedAt: now,
  };
}

export function mergeProjectIntoLessonProgress(
  lesson: Lesson,
  progress: LessonProgress,
): LessonProgress {
  if (!lessonToolIds[lesson.id]) return progress;
  const repository = getBrowserProjectRepository();
  const project = repository?.getActiveProject();
  if (!project) return progress;

  const builderId = `${lesson.id}.make.builder`;
  const code =
    project.artifacts.find((item) => item.id === `${lesson.id}.generated-code`)
      ?.content ?? "";
  const now = new Date().toISOString();
  const fields: Record<string, string | string[]> =
    lesson.id === "lesson-01"
      ? {
          "app-name": project.title,
          direction: project.scenario.context,
          "page-title": project.intent.expectedOutcome,
          "prompt-text": project.intent.statement,
          "theme-color": project.styles.tokens.accent ?? "#7C3AED",
        }
      : {
          "event-task":
            String(project.interactions[0]?.config.task ?? ""),
          effects: String(project.interactions[0]?.config.effects ?? "")
            .split(",")
            .filter(Boolean),
          "feedback-text": String(project.interactions[0]?.config.feedback ?? ""),
          "event-color": String(
            project.interactions[0]?.config.accent ??
              project.styles.tokens.accent ??
              "#7C3AED",
          ),
          "start-value": String(
            project.interactions[0]?.config.startValue ?? 0,
          ),
        };
  const nextBuilder = updatePayload(
    progress.interactions[builderId],
    fields,
    code,
    now,
  );
  if (!nextBuilder) return progress;
  return {
    ...progress,
    interactions: { ...progress.interactions, [builderId]: nextBuilder },
    updatedAt: now,
  };
}
