import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultProject,
  createProjectSnapshot,
  migrateProjectDocument,
  projectDocumentSchema,
  restoreProjectSnapshot,
} from "../../lib/projects/project-document.ts";

test("默认 ProjectDocument 包含正式字段并通过严格验证", () => {
  const project = createDefaultProject("project-test", "2026-07-26T00:00:00.000Z");
  assert.equal(projectDocumentSchema.safeParse(project).success, true);
  for (const field of [
    "projectId", "title", "audience", "scenario", "intent", "scope", "pages",
    "structure", "styles", "components", "interactions", "inputs", "conditions",
    "state", "tests", "artifacts", "decisions", "feedback", "versions", "publication",
  ]) {
    assert.equal(field in project, true, `缺少字段 ${field}`);
  }
});

test("v0 项目可安全迁移，未知版本会被拒绝", () => {
  const migrated = migrateProjectDocument(
    { id: "legacy-1", name: "旧项目", html: "<h1>旧页面</h1>" },
    "2026-07-26T00:00:00.000Z",
  );
  assert.equal(migrated.projectId, "legacy-1");
  assert.equal(migrated.title, "旧项目");
  assert.equal(migrated.artifacts[0].content, "<h1>旧页面</h1>");
  assert.throws(() => migrateProjectDocument({ schemaVersion: 99 }));
});

test("版本快照不递归保存版本数组，并可恢复项目内容", () => {
  const project = createDefaultProject("project-version", "2026-07-26T00:00:00.000Z");
  project.title = "保存前";
  const snapshot = createProjectSnapshot(project);
  assert.deepEqual(JSON.parse(snapshot).versions, []);
  project.title = "保存后";
  const restored = restoreProjectSnapshot(project, snapshot, "2026-07-26T01:00:00.000Z");
  assert.equal(restored.title, "保存前");
  assert.equal(restored.projectId, project.projectId);
});
