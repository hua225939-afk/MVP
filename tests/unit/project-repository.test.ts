import assert from "node:assert/strict";
import test from "node:test";
import {
  PROJECT_BACKUP_PREFIX,
  ACTIVE_PROJECT_KEY,
  PROJECT_PATCH_PREFIX,
  PROJECT_STORAGE_PREFIX,
  ProjectRepository,
  type ProjectStorage,
} from "../../lib/projects/project-repository.ts";
import { createDefaultProject } from "../../lib/projects/project-document.ts";

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("项目可创建、自动修订、保存并恢复", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z");
  const created = repository.create("project-save", "喝水提醒站");
  const saved = repository.save({ ...created, title: "喝水记录站" });
  const restored = repository.get("project-save");
  assert.equal(saved.revision, 1);
  assert.equal(restored?.title, "喝水记录站");
  assert.deepEqual(repository.list().map((item) => item.projectId), ["project-save"]);
});

test("损坏数据先备份再隔离，重置数据也保留可恢复备份", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z");
  storage.setItem(`${PROJECT_STORAGE_PREFIX}broken`, "{bad");
  assert.equal(repository.get("broken"), null);
  assert.equal(
    [...storage.values.keys()].some((key) => key.startsWith(`${PROJECT_BACKUP_PREFIX}broken:corrupt:`)),
    true,
  );

  repository.create("reset-me", "需要重置");
  const reset = repository.reset("reset-me");
  assert.equal(reset.projectId, "reset-me");
  assert.equal(
    [...storage.values.keys()].some((key) => key.startsWith(`${PROJECT_BACKUP_PREFIX}reset-me:reset:`)),
    true,
  );
});

test("Schema 自动迁移前保留原始项目备份", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(
    storage,
    () => "2026-07-26T00:00:00.000Z",
  );
  const legacy = createDefaultProject(
    "migration-backup",
    "2026-07-25T00:00:00.000Z",
    "迁移前项目",
  ) as unknown as Record<string, unknown>;
  delete legacy.styleTokens;
  storage.setItem(
    `${PROJECT_STORAGE_PREFIX}migration-backup`,
    JSON.stringify(legacy),
  );
  const migrated = repository.get("migration-backup");
  assert.equal(migrated?.title, "迁移前项目");
  assert.equal(migrated?.styleTokens.primary, "#7C3AED");
  assert.equal(
    [...storage.values.keys()].some((key) =>
      key.startsWith(
        `${PROJECT_BACKUP_PREFIX}migration-backup:migration:`,
      ),
    ),
    true,
  );
});

test("字段权限阻止工具越权修改 ProjectDocument", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z");
  repository.create("permission", "字段权限");
  assert.throws(() =>
    repository.applyPatch("permission", {
      projectId: "permission",
      baseRevision: 0,
      source: "lesson",
      lessonId: "lesson-06",
      toolId: "click-event",
      allowedFields: ["interactions"],
      changes: { title: "不应允许" },
      createdAt: "2026-07-26T00:00:00.000Z",
    }),
  );
});

test("成功 ProjectPatch 会校验 baseRevision 并留下审计记录", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage, () => "2026-07-26T00:00:00.000Z");
  repository.create("audit", "审计项目");
  const saved = repository.applyPatch("audit", {
    projectId: "audit",
    baseRevision: 0,
    source: "workbench",
    lessonId: "lesson-01",
    toolId: "intent-canvas",
    allowedFields: ["title"],
    changes: { title: "有轨迹的项目" },
    decision: "名称更清楚",
    createdAt: "2026-07-26T00:00:00.000Z",
  });
  assert.equal(saved.revision, 1);
  assert.equal(
    JSON.parse(storage.getItem(`${PROJECT_PATCH_PREFIX}audit`) ?? "[]").length,
    1,
  );
  assert.throws(() =>
    repository.applyPatch("audit", {
      projectId: "audit",
      baseRevision: 0,
      source: "workbench",
      lessonId: null,
      toolId: null,
      allowedFields: ["title"],
      changes: { title: "过期修改" },
      createdAt: "2026-07-26T00:00:00.000Z",
    }),
  );
});

test("教师与家长使用只读 Repository 时不能修改学生项目", () => {
  const storage = new MemoryStorage();
  const studentRepository = new ProjectRepository(storage);
  studentRepository.create("readonly", "学生项目");
  const readonlyRepository = new ProjectRepository(
    storage,
    () => "2026-07-26T00:00:00.000Z",
    "read-only",
  );
  assert.equal(readonlyRepository.get("readonly")?.title, "学生项目");
  assert.throws(() =>
    readonlyRepository.applyPatch("readonly", {
      projectId: "readonly",
      baseRevision: 0,
      source: "workbench",
      lessonId: null,
      toolId: null,
      allowedFields: ["title"],
      changes: { title: "教师不应改写" },
      createdAt: "2026-07-26T00:00:00.000Z",
    }),
  );
});

test("版本快照可恢复，同时保留版本历史", () => {
  const storage = new MemoryStorage();
  let tick = 0;
  const repository = new ProjectRepository(
    storage,
    () => new Date(Date.UTC(2026, 6, 26, 0, 0, tick++)).toISOString(),
  );
  const created = repository.create("restore-version", "版本 A");
  const versioned = repository.createVersion(created.projectId, "A");
  const changed = repository.applyPatch(created.projectId, {
    projectId: created.projectId,
    baseRevision: versioned.revision,
    source: "workbench",
    lessonId: null,
    toolId: null,
    allowedFields: ["title"],
    changes: { title: "版本 B" },
    createdAt: "2026-07-26T00:00:10.000Z",
  });
  assert.equal(changed.title, "版本 B");
  const restored = repository.restoreVersion(
    created.projectId,
    versioned.versions[0].id,
  );
  assert.equal(restored.title, "版本 A");
  assert.equal(restored.versions.length, 1);
});

test("activeProjectId 可创建、切换并由新 Repository 实例恢复", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage);
  const first = repository.createAndActivate("创造基地项目", "from-base");
  const second = repository.createAndActivate("我的作品项目", "from-projects");
  assert.equal(repository.getActiveProjectId(), second.projectId);
  repository.setActiveProjectId(first.projectId);
  assert.equal(storage.getItem(ACTIVE_PROJECT_KEY), first.projectId);
  const refreshed = new ProjectRepository(storage);
  assert.equal(refreshed.getActiveProject()?.projectId, first.projectId);
});

test("多项目正文、测试和版本互不串联", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage);
  const first = repository.createAndActivate("项目一", "project-one");
  const second = repository.createAndActivate("项目二", "project-two");
  repository.applyPatch(first.projectId, {
    projectId: first.projectId,
    baseRevision: first.revision,
    source: "workbench",
    lessonId: null,
    toolId: null,
    allowedFields: ["title", "tests"],
    changes: {
      title: "只修改项目一",
      tests: [{
        id: "test-one",
        name: "项目一测试",
        status: "pass",
        projectRevision: 0,
        toolId: null,
        message: "通过",
        attempts: 1,
        updatedAt: new Date().toISOString(),
      }],
    },
    createdAt: new Date().toISOString(),
  });
  assert.equal(repository.get(first.projectId)?.tests.length, 1);
  assert.equal(repository.get(second.projectId)?.tests.length, 0);
  assert.equal(repository.get(second.projectId)?.title, "项目二");
});
