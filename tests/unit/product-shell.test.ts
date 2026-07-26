import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { demoRoles } from "../../data/mock/platform-data.ts";
import {
  demoEvidenceRecords,
  demoStudentRecords,
  roleMessages,
  roleProfiles,
} from "../../data/mock/product-shell-data.ts";
import { PlatformRepository } from "../../lib/platform/platform-repository.ts";
import type { ProjectStorage } from "../../lib/projects/project-repository.ts";

class MemoryStorage implements ProjectStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const read = (path: string) => readFileSync(path, "utf8");

test("五角色导航包含角色业务入口以及消息、我的和设置", () => {
  assert.equal(demoRoles.length, 5);
  for (const role of demoRoles) {
    const labels = role.navigation.map((item) => item.label);
    assert.ok(labels.includes("消息"), `${role.id} 缺少消息`);
    assert.ok(labels.includes("我的"), `${role.id} 缺少我的`);
    assert.ok(labels.includes("设置"), `${role.id} 缺少设置`);
    for (const item of role.navigation) {
      assert.match(item.href, /^\//);
    }
  }
  assert.deepEqual(
    demoRoles.find((role) => role.id === "teacher")?.navigation.slice(0, 7).map((item) => item.label),
    ["教学总览", "学生进度", "项目证据", "点评待办", "我的课程", "备课与示范", "成长报告"],
  );
});

test("我的页面集中数据按五个角色展示差异", () => {
  assert.equal(Object.keys(roleProfiles).length, 5);
  assert.equal(roleProfiles.student.title, "学生");
  assert.equal(roleProfiles.teacher.title, "教师");
  assert.notDeepEqual(roleProfiles.student.metrics, roleProfiles.teacher.metrics);
  assert.match(read("components/platform/CommonRolePages.tsx"), /roleProfiles\[roleId\]/);
});

test("消息页面按角色使用不同集中演示消息", () => {
  assert.equal(Object.keys(roleMessages).length, 5);
  assert.match(roleMessages.student[0].type, /教师反馈|课程提醒/);
  assert.equal(roleMessages.teacher[0].type, "学生求助");
  assert.equal(roleMessages.parent[0].type, "学习周报");
  assert.notEqual(roleMessages.hq[0].title, roleMessages.partner[0].title);
});

test("设置和帮助页面保持静态演示边界", () => {
  const source = read("components/platform/CommonRolePages.tsx");
  assert.match(source, /设置与演示偏好/);
  assert.match(source, /清除本地数据 · 已禁用/);
  assert.match(source, /disabled type="button"/);
  assert.match(source, /<details>/);
});

test("教师学生、证据和点评路由全部存在", () => {
  for (const path of [
    "app/teacher/students/page.tsx",
    "app/teacher/students/[studentId]/page.tsx",
    "app/teacher/evidence/page.tsx",
    "app/teacher/reviews/page.tsx",
    "app/teacher/courses/page.tsx",
    "app/teacher/prep/page.tsx",
    "app/teacher/reports/page.tsx",
  ]) {
    assert.equal(existsSync(path), true, path);
  }
});

test("学生卡片和教师总览使用真实 Link 进入学生详情", () => {
  const source = read("components/platform/TeacherWorkspace.tsx");
  assert.match(source, /href=\{`\/teacher\/students\/\$\{student\.id\}`\}/);
  assert.doesNotMatch(source, /onClick=\{\(\) => router\.push\(`\/teacher\/students/);
});

test("证据详情由 button 打开并具备对话框与关闭按钮语义", () => {
  const source = read("components/platform/TeacherWorkspace.tsx");
  assert.match(source, /className="evidence-card"/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-label="关闭证据详情"/);
});

test("教师结构化评语写入统一平台仓库且兼容简短评语读取", () => {
  const storage = new MemoryStorage();
  const repository = new PlatformRepository(
    storage,
    () => "2026-07-26T10:30:00.000Z",
  );
  repository.saveTeacherFeedback({
    teacherId: "teacher-lin",
    studentId: "student-an",
    evidenceId: "evidence-an-click-test",
    lessonId: "lesson-06",
    summary: "能用失败证据说明为什么修改。",
    strengths: "连续点击测试记录清楚。",
    suggestion: "完成重置逻辑后重新运行同一测试。",
    mark: "doing_well",
    status: "completed",
  });
  const feedback = repository.listFeedback("student-an")[0];
  assert.equal(feedback.summary, "能用失败证据说明为什么修改。");
  assert.equal(feedback.strengths, "连续点击测试记录清楚。");
  assert.equal(feedback.evidenceId, "evidence-an-click-test");
  assert.equal(feedback.visibility, "student_and_parent");
});

test("班级、学生和证据集中演示数据引用保持一致", () => {
  const ids = new Set(demoStudentRecords.map((student) => student.id));
  assert.equal(ids.size, demoStudentRecords.length);
  assert.ok(demoStudentRecords.every((student) => student.classId === "class-demo"));
  assert.ok(demoEvidenceRecords.every((evidence) => ids.has(evidence.studentId)));
  assert.equal(demoRoles.find((role) => role.id === "teacher")?.href, "/teacher");
});

test("公共外壳与教师核心交互提供基础键盘语义", () => {
  const shell = read("components/platform/RoleShell.tsx");
  const teacher = read("components/platform/TeacherWorkspace.tsx");
  assert.match(shell, /aria-expanded=/);
  assert.match(shell, /aria-label="消息预览"/);
  assert.match(teacher, /aria-pressed=/);
  assert.match(teacher, /type="button"/);
  assert.match(read("app/globals.css"), /:focus-visible/);
});

test("现有 13 节课程仍由同一内容目录和路由回归覆盖", () => {
  for (let order = 1; order <= 13; order += 1) {
    assert.equal(
      existsSync(`content/lessons/lesson-${String(order).padStart(2, "0")}.json`),
      true,
    );
  }
  assert.match(read("app/learn/[courseId]/[lessonId]/page.tsx"), /LessonExperience/);
});
