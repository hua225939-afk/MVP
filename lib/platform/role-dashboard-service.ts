import type { Course, Lesson } from "../lesson-schema.ts";
import { LearningProgressRepository } from "../progress-storage.ts";
import type { ProjectDocument } from "../projects/project-document.ts";
import {
  ProjectRepository,
  type ProjectStorage,
} from "../projects/project-repository.ts";
import type { CourseToolDefinition } from "../tools/course-tool-registry.ts";
import { interactionMetadata } from "../interaction-types.ts";
import { demoIdentities } from "./demo-identities.ts";
import { PlatformRepository } from "./platform-repository.ts";

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function lessonPercent(progress: ReturnType<LearningProgressRepository["readLesson"]>) {
  return Math.round((progress.completedStepIds.length / 6) * 100);
}

function latestProject(projects: ProjectDocument[]) {
  return [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function projectOutputComplete(project: ProjectDocument | null, lessonId: string) {
  return Boolean(
    project?.artifacts.some(
      (item) =>
        item.id.includes(lessonId) ||
        item.name.includes(lessonId.replace("lesson-", "第 ")) ,
    ),
  );
}

function abilityEvidence(project: ProjectDocument | null) {
  if (!project) return [];
  const resolvedBugs = project.bugReports.filter(
    (item) => item.status === "resolved",
  ).length;
  const passedTests = project.tests.filter((item) => item.status === "pass").length;
  const acceptedFeedback =
    project.feedback.filter((item) => item.status === "accepted").length +
    project.peerReviews.filter((item) => item.studentSummary.trim()).length;
  return [
    {
      label: "创造力",
      evidence:
        project.decisions.length || project.components.length
          ? `完成 ${project.decisions.length} 次创作选择，组装 ${project.components.length} 个组件`
          : "完成创作选择或组装组件后生成记录",
    },
    {
      label: "逻辑",
      evidence:
        project.interactions.length +
          project.inputs.length +
          project.conditions.length +
          project.state.length >
        0
          ? `已建立 ${project.interactions.length + project.inputs.length + project.conditions.length + project.state.length} 条互动、输入、判断或状态记录`
          : "完成互动、输入、判断或状态任务后生成记录",
    },
    {
      label: "调试",
      evidence:
        project.tests.length || project.bugReports.length
          ? `运行 ${project.tests.length} 条测试，通过 ${passedTests} 条，修复 ${resolvedBugs} 个 Bug`
          : "运行测试或修复 Bug 后生成记录",
    },
    {
      label: "表达",
      evidence:
        acceptedFeedback || project.versions.length || project.studentPresentation.finalizedAt
          ? `采纳 ${acceptedFeedback} 条反馈，保存 ${project.versions.length} 个版本${project.studentPresentation.finalizedAt ? "，已完成作品介绍" : ""}`
          : "保存版本、采纳反馈或完成作品介绍后生成记录",
    },
  ];
}

function toolUseCount(project: ProjectDocument | null, tool: CourseToolDefinition) {
  if (!project) return 0;
  const decisions = project.decisions.filter(
    (item) => item.toolId === tool.id,
  ).length;
  const tests = project.tests.filter((item) => item.toolId === tool.id).length;
  const fieldEvidence = tool.outputFields.some((field) => {
    const value = project[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    if (value && typeof value === "object") {
      return Object.values(value).some((item) =>
        Array.isArray(item) ? item.length > 0 : Boolean(item),
      );
    }
    return Boolean(value);
  });
  return decisions + tests + (fieldEvidence ? 1 : 0);
}

export class RoleDashboardService {
  private readonly projects: ProjectRepository;
  private readonly progress: LearningProgressRepository;
  private readonly platform: PlatformRepository;
  private readonly course: Course;
  private readonly lessons: Lesson[];
  private readonly tools: readonly CourseToolDefinition[];

  constructor(
    storage: ProjectStorage,
    course: Course,
    lessons: Lesson[],
    tools: readonly CourseToolDefinition[],
  ) {
    this.course = course;
    this.lessons = lessons;
    this.tools = tools;
    this.projects = new ProjectRepository(storage);
    this.progress = new LearningProgressRepository(
      storage,
      demoIdentities.student.id,
    );
    this.platform = new PlatformRepository(storage);
  }

  getStudentDashboard() {
    const project = this.currentProject();
    const lessonRows = this.lessonRows(project);
    const completedLessons = lessonRows.filter(
      (item) => item.status === "completed",
    ).length;
    const current =
      [...lessonRows]
        .filter((item) => item.status !== "completed")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      lessonRows.at(-1);
    return {
      identity: demoIdentities.student,
      project,
      projects: this.studentProjects(),
      lessons: lessonRows,
      completedLessons,
      progressPercent: Math.round(
        (completedLessons / this.course.totalLessons) * 100,
      ),
      currentLessonId: current?.id ?? "lesson-01",
      unlockedTools: this.tools.filter(
        (tool) =>
          lessonRows.find((item) => item.id === tool.lessonId)?.status !==
          "not_started",
      ),
      feedback: this.platform.listFeedback(demoIdentities.student.id),
      abilities: abilityEvidence(project),
    };
  }

  getTeacherDashboard() {
    const student = this.getStudentDashboard();
    const project = student.project;
    return {
      identity: demoIdentities.teacher,
      classRecord: demoIdentities.classRecord,
      student: {
        ...demoIdentities.student,
        completedLessons: student.completedLessons,
        currentLessonId: student.currentLessonId,
        progressPercent: student.progressPercent,
        lessonOutputs: student.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          complete: lesson.outputComplete,
          status: lesson.status,
        })),
      },
      project,
      comparison: {
        aiDraft: project?.aiDraft?.appIntent ?? project?.aiDrafts.at(-1)?.payload ?? "",
        studentRevision:
          project?.studentRevision?.appIntent ??
          project?.studentRevisions.at(-1)?.payload ??
          "",
        finalContent:
          project?.finalIntent?.appIntent ?? project?.intent.statement ?? "",
      },
      feedback: this.platform.listFeedback(demoIdentities.student.id),
      attention: this.platform.getAttention(demoIdentities.student.id),
      classProgress: student.progressPercent,
    };
  }

  saveTeacherFeedback(summary: string) {
    return this.platform.saveTeacherFeedback({
      teacherId: demoIdentities.teacher.id,
      studentId: demoIdentities.student.id,
      summary,
    });
  }

  setStudentAttention(
    status: "needs_attention" | "doing_well" | null,
  ) {
    this.platform.setAttention(demoIdentities.student.id, status);
  }

  getParentDashboard() {
    const student = this.getStudentDashboard();
    if (!demoIdentities.parent.studentIds.includes(student.identity.id)) {
      return { identity: demoIdentities.parent, student: null };
    }
    return {
      identity: demoIdentities.parent,
      student: {
        identity: student.identity,
        completedLessons: student.completedLessons,
        progressPercent: student.progressPercent,
        currentLessonId: student.currentLessonId,
        recentTasks: student.lessons
          .filter((item) => item.status !== "not_started")
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 3),
        project: student.project
          ? {
              id: student.project.projectId,
              title: student.project.title,
              summary:
                student.project.finalIntent?.appIntent ||
                student.project.intent.statement ||
                "正在把想法逐步变成网页应用",
              versions: student.project.versions.map((item) => ({
                id: item.id,
                label: item.label,
                description: item.description,
                createdAt: item.createdAt,
              })),
              publication: student.project.publication,
            }
          : null,
        abilities: student.abilities,
        feedback: student.feedback,
      },
    };
  }

  getPartnerDashboard() {
    const student = this.getStudentDashboard();
    const projects = student.projects;
    const published = projects.filter((item) =>
      item.publication.status.startsWith("published"),
    ).length;
    const needsAttention =
      this.platform.getAttention(demoIdentities.student.id) ===
      "needs_attention"
        ? 1
        : 0;
    return {
      identity: demoIdentities.partner,
      campus: demoIdentities.campus,
      classes: [demoIdentities.classRecord],
      teachers: [demoIdentities.teacher],
      stats: {
        classes: 1,
        students: 1,
        teachers: 1,
        averageProgress: student.progressPercent,
        completionRate: student.progressPercent,
        projects: projects.length,
        published,
        activeLessonId: student.currentLessonId,
        needsAttention,
      },
    };
  }

  getHqDashboard() {
    const student = this.getStudentDashboard();
    const projects = student.projects;
    const unitCompletion = this.course.units.map((unit) => {
      const unitLessons = student.lessons.filter(
        (lesson) => lesson.unitId === unit.id,
      );
      return {
        id: unit.id,
        title: unit.title,
        percent: average(unitLessons.map((lesson) => lesson.percent)),
      };
    });
    return {
      identity: demoIdentities.hq,
      stats: {
        partners: 1,
        campuses: 1,
        classes: 1,
        students: 1,
        teachers: 1,
        courses: 1,
        lessons: this.lessons.length,
        interactionComponents: Object.keys(interactionMetadata).length,
        courseTools: this.tools.length,
        projects: projects.length,
        published: projects.filter((item) =>
          item.publication.status.startsWith("published"),
        ).length,
      },
      unitCompletion,
      toolUsage: this.tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        lessonId: tool.lessonId,
        count: toolUseCount(student.project, tool),
      })),
    };
  }

  private studentProjects() {
    return this.projects
      .list()
      .filter(
        (project) =>
          project.studentId === demoIdentities.student.id &&
          project.courseId === this.course.id,
      );
  }

  private currentProject() {
    const active = this.projects.getActiveProject();
    if (
      active?.studentId === demoIdentities.student.id &&
      active.courseId === this.course.id
    ) {
      return active;
    }
    return latestProject(this.studentProjects());
  }

  private lessonRows(project: ProjectDocument | null) {
    return this.lessons.map((lesson) => {
      const progress = this.progress.readLesson(this.course.id, lesson);
      return {
        id: lesson.id,
        unitId: lesson.unitId,
        order: lesson.order,
        title: lesson.title,
        status: progress.status,
        currentStepId: progress.currentStepId,
        completedStepIds: progress.completedStepIds,
        updatedAt: progress.updatedAt,
        percent: lessonPercent(progress),
        outputComplete:
          progress.status === "completed" ||
          projectOutputComplete(project, lesson.id),
      };
    });
  }
}

export function getBrowserRoleDashboardService(
  course: Course,
  lessons: Lesson[],
  tools: readonly CourseToolDefinition[],
) {
  return typeof window === "undefined"
    ? null
    : new RoleDashboardService(window.localStorage, course, lessons, tools);
}
