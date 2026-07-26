import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createActiveProject } from "../../lib/projects/project-actions.ts";
import {
  ProjectRepository,
  type ProjectStorage,
} from "../../lib/projects/project-repository.ts";

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("创造基地和我的作品使用相同创建动作并跳转新项目创造台", () => {
  const repository = new ProjectRepository(new MemoryStorage());
  const fromBase = createActiveProject(repository, "创造基地项目");
  const fromProjects = createActiveProject(repository, "我的作品项目");
  assert.match(
    fromBase.workbenchPath,
    new RegExp(`/student/workbench/${fromBase.project.projectId}$`),
  );
  assert.match(
    fromProjects.workbenchPath,
    new RegExp(`/student/workbench/${fromProjects.project.projectId}$`),
  );
  assert.equal(repository.list().length, 2);
  assert.equal(repository.getActiveProjectId(), fromProjects.project.projectId);
});

test("两个学生页面只从 ProjectRepository 读取项目", () => {
  const baseSource = readFileSync(
    resolve(process.cwd(), "components/workbench/StudentCreationBase.tsx"),
    "utf8",
  );
  const projectsSource = readFileSync(
    resolve(process.cwd(), "components/workbench/ProjectList.tsx"),
    "utf8",
  );
  assert.match(baseSource, /getBrowserProjectRepository/);
  assert.match(projectsSource, /getBrowserProjectRepository/);
  assert.doesNotMatch(baseSource, /dashboard\.works|getStudentDashboard/);
  assert.doesNotMatch(projectsSource, /dashboard\.works|getStudentDashboard/);
  assert.match(
    baseSource,
    /student\/workbench\/\$\{activeProject\.projectId\}/,
  );
});

test("课程页的创造台入口使用 activeProjectId，不再引用固定项目 ID", () => {
  const lessonSource = readFileSync(
    resolve(process.cwd(), "components/lesson/LessonExperience.tsx"),
    "utf8",
  );
  const syncSource = readFileSync(
    resolve(process.cwd(), "lib/projects/lesson-project-sync.ts"),
    "utf8",
  );
  assert.match(lessonSource, /getActiveProjectId/);
  assert.match(lessonSource, /student\/workbench\/\$\{activeProjectId\}/);
  assert.doesNotMatch(lessonSource, /DEFAULT_PROJECT_ID/);
  assert.match(syncSource, /getActiveProject\(\)/);
  assert.doesNotMatch(syncSource, /DEFAULT_PROJECT_ID/);
});
