import {
  demoEvidenceRecords,
  demoStudentRecords,
  type DemoEvidenceRecord,
  type DemoStudentRecord,
} from "@/data/mock/product-shell-data";
import type { Lesson } from "@/lib/lesson-schema";
import type { ProjectDocument } from "@/lib/projects/project-document";

function readable(value: unknown, empty = "尚未形成内容") {
  if (typeof value === "string") return value.trim() || empty;
  if (Array.isArray(value)) {
    const text = value
      .map((item) =>
        typeof item === "string"
          ? item
          : item && typeof item === "object"
            ? JSON.stringify(item)
            : String(item),
      )
      .join("；");
    return text || empty;
  }
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return empty;
}

export function mergeLiveStudent(
  live: {
    completedLessons: number;
    currentLessonId: string;
    progressPercent: number;
  } | null,
  project: ProjectDocument | null,
) {
  return demoStudentRecords.map((student) => {
    if (
      student.id !== "student-an" ||
      !live ||
      (live.completedLessons === 0 &&
        live.currentLessonId === "lesson-01" &&
        !project)
    ) {
      return student;
    }
    return {
      ...student,
      completedLessons: live.completedLessons,
      currentLessonId: live.currentLessonId,
      projectName: project?.title ?? student.projectName,
      projectVersion:
        project?.versions.at(-1)?.label ??
        (project ? `修订 ${project.revision}` : student.projectVersion),
      latestDecision:
        project?.decisions.at(-1)?.title ?? student.latestDecision,
      latestChange:
        project?.decisions.at(-1)?.reason || student.latestChange,
      lastSaved: project
        ? new Date(project.updatedAt).toLocaleString("zh-CN", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : student.lastSaved,
      testStatus:
        project?.tests.at(-1)?.status === "pass"
          ? ("全部通过" as const)
          : project?.tests.at(-1)?.status === "fail"
            ? ("连续失败" as const)
            : student.testStatus,
    };
  });
}

export function projectEvidence(
  project: ProjectDocument | null,
): DemoEvidenceRecord[] {
  if (!project) return demoEvidenceRecords;
  const createdAt = new Date(project.updatedAt).toLocaleString("zh-CN");
  const version =
    project.versions.at(-1)?.label || `修订 ${project.revision}`;
  const base = {
    studentId: project.studentId,
    version,
    createdAt,
    reviewStatus: "待点评" as const,
  };
  const evidence: DemoEvidenceRecord[] = [];
  const add = (
    id: string,
    lessonId: string,
    name: string,
    type: string,
    source: DemoEvidenceRecord["source"],
    content: unknown,
    modificationReason = "",
    testStatus = "待检查",
  ) => {
    const fullContent = readable(content);
    if (fullContent === "尚未形成内容") return;
    evidence.push({
      ...base,
      id,
      lessonId,
      name,
      type,
      source,
      preview: fullContent.replaceAll(/\s+/g, " ").slice(0, 110),
      fullContent,
      modificationReason,
      testStatus,
    });
  };

  add("live-interest-map", "lesson-01", "兴趣地图", "兴趣地图", "项目记录", project.interestMap);
  add("live-sketch", "lesson-01", "草图与画板", "草图与画板", "学生修改", project.sketch.elements, "学生在画板中持续调整页面想法。");
  add("live-ai-draft", "lesson-01", "AI 初始草稿", "AI 初始草稿", "AI生成", project.aiDraft ?? project.aiDrafts.at(-1)?.payload);
  add("live-student-revision", "lesson-01", "学生修改稿", "学生修改稿", "学生修改", project.studentRevision ?? project.studentRevisions.at(-1)?.payload, project.studentRevisions.at(-1)?.reason);
  add("live-final-intent", "lesson-02", "最终采用内容", "最终采用内容", "最终采用", project.finalIntent ?? project.intent, "由学生确认并保留为项目方向。");
  add("live-structure", "lesson-03", "页面结构", "页面结构", "项目记录", project.structure);
  add("live-style", "lesson-04", "视觉样式", "视觉样式", "最终采用", project.styleTokens, project.moodboard.reason);
  add("live-interactions", "lesson-06", "互动逻辑", "互动逻辑", "学生修改", project.interactions);
  project.tests.forEach((test) =>
    add(`live-test-${test.id}`, "lesson-06", test.name, "测试结果", "项目记录", test.message, "", test.status === "pass" ? "通过" : test.status === "fail" ? "失败" : "待运行"),
  );
  project.bugReports.forEach((bug) =>
    add(`live-bug-${bug.id}`, "lesson-11", bug.title, "Bug记录", "项目记录", `${bug.actual}\n预期：${bug.expected}\n复现：${bug.reproSteps.join(" → ")}`, "", bug.status),
  );
  project.peerReviews.forEach((review) =>
    add(`live-peer-${review.id}`, "lesson-12", "同伴试玩反馈", "同伴反馈", "项目记录", `${review.note}\n喜欢：${review.favorite}\n建议：${review.suggestion}`, review.studentSummary),
  );
  project.versions.forEach((item) =>
    add(`live-version-${item.id}`, "lesson-10", item.label, "项目版本", "项目记录", item.description || item.changes, "", item.testSummary || "已保存"),
  );
  add("live-publication", "lesson-13", "发布材料", "发布材料", "最终采用", project.publication, project.publication.learningReflection, project.publication.status);

  const otherDemoEvidence = demoEvidenceRecords.filter(
    (item) => item.studentId !== project.studentId,
  );
  return [...evidence, ...otherDemoEvidence];
}

export function learningTrail(
  student: DemoStudentRecord,
  lessons: Lesson[],
) {
  return lessons.map((lesson) => {
    const completed = lesson.order <= student.completedLessons;
    const current = lesson.id === student.currentLessonId;
    return {
      id: lesson.id,
      order: lesson.order,
      title: lesson.title,
      status: completed ? "已完成" : current ? "进行中" : "未开始",
      step: completed ? "说" : current ? student.currentStep : "—",
      decision:
        current
          ? student.latestDecision
          : completed
            ? `已保存第 ${String(lesson.order).padStart(2, "0")} 课阶段决定`
            : "等待进入课程",
      change: current ? student.latestChange : completed ? "已形成阶段产出" : "—",
      activity: current ? student.lastActivity : completed ? "本周已完成" : "—",
    };
  });
}
