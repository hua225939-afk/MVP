import {
  createDefaultProject,
  createProjectSnapshot,
  migrateProjectDocument,
  PROJECT_EDITABLE_FIELDS,
  projectDocumentSchema,
  restoreProjectSnapshot,
  type ProjectDocument,
  type ProjectTopLevelField,
} from "./project-document.ts";

export interface ProjectStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ProjectPatch = {
  projectId: string;
  baseRevision: number;
  source: "lesson" | "workbench" | "migration" | "system";
  lessonId: string | null;
  toolId: string | null;
  allowedFields: readonly ProjectTopLevelField[];
  changes: Partial<Pick<ProjectDocument, ProjectTopLevelField>>;
  decision?: string;
  createdAt: string;
};

export const PROJECT_STORAGE_PREFIX = "vibe-coding:v1:project:";
export const PROJECT_INDEX_KEY = "vibe-coding:v1:project-index";
export const PROJECT_BACKUP_PREFIX = "vibe-coding:v1:project-backup:";
export const PROJECT_PATCH_PREFIX = "vibe-coding:v1:project-patches:";
export const ACTIVE_PROJECT_KEY = "vibe-coding:v1:active-project:student-an";
export const PROJECT_UPDATED_EVENT = "vibe-coding:project-updated";

function projectKey(projectId: string) {
  return `${PROJECT_STORAGE_PREFIX}${projectId}`;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ProjectRepository {
  private readonly storage: ProjectStorage;
  private readonly now: () => string;
  private readonly access: "read-write" | "read-only";

  constructor(
    storage: ProjectStorage,
    now: () => string = () => new Date().toISOString(),
    access: "read-write" | "read-only" = "read-write",
  ) {
    this.storage = storage;
    this.now = now;
    this.access = access;
  }

  list(): ProjectDocument[] {
    const ids = this.readIndex();
    return ids
      .map((projectId) => this.get(projectId))
      .filter((project): project is ProjectDocument => project !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getActiveProjectId(): string | null {
    const projectId = this.storage.getItem(ACTIVE_PROJECT_KEY);
    if (!projectId) return null;
    if (this.get(projectId)) return projectId;
    if (this.access === "read-write") {
      this.storage.removeItem(ACTIVE_PROJECT_KEY);
    }
    return null;
  }

  getActiveProject(): ProjectDocument | null {
    const projectId = this.getActiveProjectId();
    return projectId ? this.get(projectId) : null;
  }

  setActiveProjectId(projectId: string): ProjectDocument {
    this.assertWritable();
    const project = this.get(projectId);
    if (!project) throw new Error("不能选择不存在的项目");
    this.storage.setItem(ACTIVE_PROJECT_KEY, projectId);
    this.notify(projectId);
    return project;
  }

  createAndActivate(title: string, projectId = createId("project")) {
    const project = this.create(projectId, title);
    this.setActiveProjectId(project.projectId);
    return project;
  }

  initializeSeedProject(): ProjectDocument {
    this.assertWritable();
    const active = this.getActiveProject();
    if (active) return active;
    const projects = this.list();
    if (projects.length > 0) {
      return this.setActiveProjectId(projects[0].projectId);
    }
    return this.createAndActivate("我的第一个应用", "vibe-foundations-student-an");
  }

  get(projectId: string): ProjectDocument | null {
    const raw = this.storage.getItem(projectKey(projectId));
    if (!raw) return null;
    try {
      const migrated = migrateProjectDocument(JSON.parse(raw), this.now());
      if (
        this.access === "read-write" &&
        migrated.schemaVersion === 1 &&
        JSON.stringify(migrated) !== raw
      ) {
        this.storage.setItem(projectKey(projectId), JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      if (this.access === "read-write") {
        this.backup(projectId, raw, "corrupt");
      }
      return null;
    }
  }

  create(projectId: string, title: string): ProjectDocument {
    this.assertWritable();
    if (this.get(projectId)) throw new Error("项目已存在");
    const project = createDefaultProject(projectId, this.now(), title.trim() || "未命名应用");
    return this.save(project, false);
  }

  ensure(projectId: string, title?: string): ProjectDocument {
    return this.get(projectId) ?? this.create(projectId, title ?? "我的第一个应用");
  }

  save(project: ProjectDocument, incrementRevision = true): ProjectDocument {
    this.assertWritable();
    const timestamp = this.now();
    const storedRevision = this.get(project.projectId)?.revision ?? 0;
    const validated = projectDocumentSchema.parse({
      ...project,
      revision: incrementRevision
        ? Math.max(project.revision, storedRevision) + 1
        : project.revision,
      updatedAt: timestamp,
    });
    this.storage.setItem(projectKey(validated.projectId), JSON.stringify(validated));
    this.writeIndex([
      validated.projectId,
      ...this.readIndex().filter((id) => id !== validated.projectId),
    ]);
    this.notify(validated.projectId);
    return validated;
  }

  applyPatch(projectId: string, patch: ProjectPatch): ProjectDocument {
    this.assertWritable();
    const current = this.ensure(projectId);
    if (patch.projectId !== projectId) {
      throw new Error("ProjectPatch 目标与请求项目不一致");
    }
    if (patch.baseRevision !== current.revision) {
      throw new Error(
        `项目修订冲突：期望 ${patch.baseRevision}，当前 ${current.revision}`,
      );
    }
    const changedFields = Object.keys(patch.changes) as ProjectTopLevelField[];
    const denied = changedFields.filter((field) => !patch.allowedFields.includes(field));
    if (denied.length > 0) {
      throw new Error(`${patch.source} 无权修改字段：${denied.join("、")}`);
    }
    const next = projectDocumentSchema.parse({ ...current, ...patch.changes });
    const saved = this.save(next);
    this.appendPatch({ ...patch, baseRevision: current.revision });
    return saved;
  }

  createVersion(
    projectId: string,
    label: string,
    description = "",
  ): ProjectDocument {
    const current = this.ensure(projectId);
    return this.applyPatch(projectId, {
      projectId,
      baseRevision: current.revision,
      source: "system",
      lessonId: null,
      toolId: null,
      allowedFields: ["versions"],
      changes: {
        versions: [
        ...current.versions,
        {
          id: createId("version"),
          label: label.trim() || `版本 ${current.versions.length + 1}`,
          description,
          revision: current.revision,
          snapshot: createProjectSnapshot(current),
          createdAt: this.now(),
        },
        ],
      },
      decision: "保存版本快照",
      createdAt: this.now(),
    });
  }

  restoreVersion(projectId: string, versionId: string): ProjectDocument {
    const current = this.ensure(projectId);
    const version = current.versions.find((item) => item.id === versionId);
    if (!version) throw new Error("版本快照不存在");
    const restored = restoreProjectSnapshot(current, version.snapshot, this.now());
    return this.applyPatch(projectId, {
      projectId,
      baseRevision: current.revision,
      source: "system",
      lessonId: null,
      toolId: null,
      allowedFields: PROJECT_EDITABLE_FIELDS,
      changes: projectContentChanges(restored),
      decision: `恢复版本：${version.label}`,
      createdAt: this.now(),
    });
  }

  reset(projectId: string): ProjectDocument {
    this.assertWritable();
    const raw = this.storage.getItem(projectKey(projectId));
    if (raw) this.backup(projectId, raw, "reset");
    const current = this.get(projectId);
    const reset = createDefaultProject(
      projectId,
      this.now(),
      current?.title ?? "我的第一个应用",
    );
    return this.save(reset, false);
  }

  private readIndex(): string[] {
    try {
      const value = JSON.parse(this.storage.getItem(PROJECT_INDEX_KEY) ?? "[]");
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  private writeIndex(ids: string[]) {
    this.storage.setItem(PROJECT_INDEX_KEY, JSON.stringify([...new Set(ids)]));
  }

  private backup(projectId: string, raw: string, reason: "corrupt" | "reset") {
    this.storage.setItem(
      `${PROJECT_BACKUP_PREFIX}${projectId}:${reason}:${Date.now()}`,
      raw,
    );
  }

  private appendPatch(patch: ProjectPatch) {
    const key = `${PROJECT_PATCH_PREFIX}${patch.projectId}`;
    try {
      const current = JSON.parse(this.storage.getItem(key) ?? "[]");
      const patches = Array.isArray(current) ? current : [];
      this.storage.setItem(key, JSON.stringify([...patches, patch].slice(-200)));
    } catch {
      this.storage.setItem(key, JSON.stringify([patch]));
    }
  }

  private notify(projectId: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(PROJECT_UPDATED_EVENT, { detail: { projectId } }),
      );
    }
  }

  private assertWritable() {
    if (this.access === "read-only") {
      throw new Error("当前 Repository 为只读，不能修改学生项目");
    }
  }
}

export function getBrowserProjectRepository() {
  if (typeof window === "undefined") return null;
  return new ProjectRepository(window.localStorage);
}

export function projectContentChanges(project: ProjectDocument) {
  return Object.fromEntries(
    PROJECT_EDITABLE_FIELDS.map((field) => [field, project[field]]),
  ) as Partial<Pick<ProjectDocument, ProjectTopLevelField>>;
}
