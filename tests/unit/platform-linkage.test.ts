import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { courseSchema, lessonSchema, type Lesson } from "../../lib/lesson-schema.ts";
import { demoStudentRecords } from "../../data/mock/product-shell-data.ts";
import { demoIdentities } from "../../lib/platform/demo-identities.ts";
import { PlatformRepository } from "../../lib/platform/platform-repository.ts";
import { RoleDashboardService } from "../../lib/platform/role-dashboard-service.ts";
import {
  LearningProgressRepository,
  PROGRESS_PREFIX,
  type LessonProgress,
} from "../../lib/progress-storage.ts";
import {
  PROJECT_INDEX_KEY,
  PROJECT_STORAGE_PREFIX,
  ProjectRepository,
  type ProjectStorage,
} from "../../lib/projects/project-repository.ts";
import { courseToolRegistry } from "../../lib/tools/course-tool-registry.ts";

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const course = courseSchema.parse(
  JSON.parse(
    fs.readFileSync("content/courses/vibe-coding-foundations.json", "utf8"),
  ),
);
const lessons = Array.from({ length: 13 }, (_, index) => {
  const id = String(index + 1).padStart(2, "0");
  return lessonSchema.parse(
    JSON.parse(fs.readFileSync(`content/lessons/lesson-${id}.json`, "utf8")),
  );
});
const now = "2026-07-26T08:00:00.000Z";

function completedProgress(lesson: Lesson): LessonProgress {
  const interactions = Object.fromEntries(
    lesson.steps.flatMap((step) =>
      step.completion.requiredAtomIds.map((atomId) => [
        atomId,
        {
          completed: true,
          correct: true,
          attempts: 1,
          updatedAt: now,
        },
      ]),
    ),
  );
  return {
    status: "completed",
    currentStepId: lesson.steps.at(-1)!.id,
    completedStepIds: lesson.steps.map((step) => step.id),
    interactions,
    startedAt: now,
    updatedAt: now,
    completedAt: now,
  };
}

function service(storage: MemoryStorage) {
  return new RoleDashboardService(
    storage,
    course,
    lessons,
    courseToolRegistry,
  );
}

test("学生课程进度通过集中 Repository 写入并恢复", () => {
  const storage = new MemoryStorage();
  const progress = new LearningProgressRepository(storage);
  progress.writeLesson(course.id, lessons[0].id, completedProgress(lessons[0]));
  assert.equal(progress.readLesson(course.id, lessons[0]).status, "completed");
  assert.equal(service(storage).getStudentDashboard().completedLessons, 1);
});

test("教师端从唯一 ProjectRepository 读取学生项目", () => {
  const storage = new MemoryStorage();
  new ProjectRepository(storage, () => now).createAndActivate(
    "安安的任务应用",
    "project-linked",
  );
  const teacher = service(storage).getTeacherDashboard();
  assert.equal(teacher.project?.projectId, "project-linked");
  assert.equal(teacher.project?.title, "安安的任务应用");
});

test("教师评语写回集中数据并被学生端读取", () => {
  const storage = new MemoryStorage();
  const dashboards = service(storage);
  dashboards.saveTeacherFeedback("能用测试证据说明这次修改。");
  assert.equal(dashboards.getStudentDashboard().feedback.length, 1);
  assert.equal(
    new PlatformRepository(storage).listFeedback(demoIdentities.student.id)[0]
      .summary,
    "能用测试证据说明这次修改。",
  );
});

test("家长只读取演示关系中关联的学生", () => {
  const storage = new MemoryStorage();
  const parent = service(storage).getParentDashboard();
  assert.deepEqual(demoIdentities.parent.studentIds, [
    demoIdentities.student.id,
  ]);
  assert.equal(parent.student?.identity.id, demoIdentities.student.id);
});

test("合作伙伴汇总由同一班级进度与项目明细计算", () => {
  const storage = new MemoryStorage();
  new ProjectRepository(storage, () => now).createAndActivate(
    "校区项目",
    "project-campus",
  );
  new LearningProgressRepository(storage).writeLesson(
    course.id,
    lessons[0].id,
    completedProgress(lessons[0]),
  );
  const partner = service(storage).getPartnerDashboard();
  assert.equal(partner.stats.classes, 1);
  assert.equal(partner.stats.students, demoStudentRecords.length);
  assert.equal(partner.stats.projects, 1);
  assert.equal(
    partner.stats.averageProgress,
    Math.round(
      demoStudentRecords
        .map((record) =>
          record.id === demoIdentities.student.id
            ? Math.round(100 / 13)
            : Math.round((record.completedLessons / 13) * 100),
        )
        .reduce((sum, value) => sum + value, 0) / demoStudentRecords.length,
    ),
  );
});

test("总部统计读取课程、身份、项目和发布明细", () => {
  const storage = new MemoryStorage();
  const repository = new ProjectRepository(storage, () => now);
  const project = repository.createAndActivate("总部统计项目", "project-hq");
  repository.save({
    ...project,
    publication: {
      ...project.publication,
      status: "published_demo",
      visibility: "public",
    },
  });
  const hq = service(storage).getHqDashboard();
  assert.equal(hq.stats.lessons, 13);
  assert.equal(hq.stats.projects, 1);
  assert.equal(hq.stats.published, 1);
  assert.equal(hq.unitCompletion.length, 5);
});

test("角色切换只改变查询投影且数据不丢失", () => {
  const storage = new MemoryStorage();
  new ProjectRepository(storage, () => now).createAndActivate(
    "跨角色项目",
    "project-role-switch",
  );
  const dashboards = service(storage);
  dashboards.saveTeacherFeedback("跨角色仍可见。");
  assert.equal(dashboards.getTeacherDashboard().project?.title, "跨角色项目");
  assert.equal(
    dashboards.getParentDashboard().student?.feedback[0].summary,
    "跨角色仍可见。",
  );
  assert.equal(dashboards.getHqDashboard().stats.projects, 1);
});

test("旧进度与旧项目 localStorage 数据安全迁移且保留原数据", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    `vibe-course-progress:${lessons[0].id}`,
    JSON.stringify({
      currentStep: 1,
      completedSteps: [lessons[0].steps[0].id],
      interactions: Object.fromEntries(
        lessons[0].steps[0].completion.requiredAtomIds.map((id) => [
          id,
          { completed: true, correct: true, value: "legacy" },
        ]),
      ),
      updatedAt: now,
    }),
  );
  const progress = new LearningProgressRepository(storage);
  assert.equal(
    progress.readLesson(course.id, lessons[0]).completedStepIds.length,
    1,
  );
  assert.ok(
    storage.getItem(
      `${PROGRESS_PREFIX}${demoIdentities.student.id}:${course.id}`,
    ),
  );
  assert.ok(storage.getItem(`vibe-course-progress:${lessons[0].id}`));

  storage.setItem(
    `${PROJECT_STORAGE_PREFIX}legacy-project`,
    JSON.stringify({
      schemaVersion: 0,
      id: "legacy-project",
      name: "旧项目",
      html: "<h1>旧内容</h1>",
    }),
  );
  storage.setItem(PROJECT_INDEX_KEY, JSON.stringify(["legacy-project"]));
  const migrated = new ProjectRepository(storage, () => now).get(
    "legacy-project",
  );
  assert.equal(migrated?.title, "旧项目");
  assert.equal(migrated?.artifacts[0].id, "legacy-code");
});

test("重复初始化和跨角色读取不会创建重复项目", () => {
  const storage = new MemoryStorage();
  const projects = new ProjectRepository(storage, () => now);
  const first = projects.initializeSeedProject();
  const second = projects.initializeSeedProject();
  service(storage).getTeacherDashboard();
  service(storage).getParentDashboard();
  assert.equal(first.projectId, second.projectId);
  assert.equal(projects.list().length, 1);
});

test("总部读取 13 课与真实组件和工具注册信息", () => {
  const storage = new MemoryStorage();
  const hq = service(storage).getHqDashboard();
  const registrySource = fs.readFileSync(
    "components/interactions/registry.tsx",
    "utf8",
  );
  assert.equal(lessons.length, 13);
  assert.equal(courseToolRegistry.length, 13);
  for (const type of [
    "reveal",
    "choice",
    "textInput",
    "codePreview",
    "runTest",
    "taskBuilder",
    "courseTool",
  ]) {
    assert.match(registrySource, new RegExp(`\\n  ${type}:`));
  }
  assert.equal(hq.stats.lessons, 13);
  assert.equal(hq.stats.interactionComponents, 7);
  assert.equal(hq.stats.courseTools, 13);
});

test("完整验收流程在刷新后保持学生项目、版本、评语与汇总一致", () => {
  const storage = new MemoryStorage();
  const progress = new LearningProgressRepository(storage);
  const projects = new ProjectRepository(storage, () => now);

  progress.writeLesson(course.id, lessons[0].id, completedProgress(lessons[0]));
  const created = projects.createAndActivate("生活任务助手", "acceptance-project");
  projects.save({
    ...created,
    intent: {
      statement: "帮助同学记录并完成每天的学习任务",
      expectedOutcome: "完成任务后得到清楚反馈",
    },
  });
  projects.createVersion("acceptance-project", "App 1.0", "完成第一版流程");

  const teacherView = service(storage).getTeacherDashboard();
  assert.equal(teacherView.student.completedLessons, 1);
  assert.equal(teacherView.project?.versions.at(-1)?.label, "App 1.0");

  service(storage).saveTeacherFeedback("能把生活问题变成清楚任务，并保存版本。");
  const parentView = service(storage).getParentDashboard();
  assert.equal(
    parentView.student?.feedback[0].summary,
    "能把生活问题变成清楚任务，并保存版本。",
  );
  assert.equal(parentView.student?.project?.title, "生活任务助手");

  const partnerView = service(storage).getPartnerDashboard();
  const hqView = service(storage).getHqDashboard();
  assert.equal(partnerView.stats.projects, 1);
  assert.equal(hqView.stats.projects, 1);

  const refreshed = service(storage);
  assert.equal(
    refreshed.getTeacherDashboard().project?.projectId,
    "acceptance-project",
  );
  assert.equal(refreshed.getParentDashboard().student?.feedback.length, 1);
  assert.equal(refreshed.getPartnerDashboard().stats.averageProgress, 27);
});
