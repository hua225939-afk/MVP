"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { createActiveProject } from "@/lib/projects/project-actions";
import {
  getBrowserProjectRepository,
  PROJECT_UPDATED_EVENT,
} from "@/lib/projects/project-repository";
import { readCourseProgressSummary } from "@/lib/progress-storage";

type LessonSummary = {
  id: string;
  order: number;
  title: string;
  studentSubtitle: string;
  badge: string;
  color: string;
  skills: string[];
};

const courseId = "vibe-coding-foundations";

export function StudentCreationBase({
  studentName,
  lessons,
}: {
  studentName: string;
  lessons: LessonSummary[];
}) {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState<ProjectDocument | null>();
  const [projectCount, setProjectCount] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [courseProgress, setCourseProgress] = useState(() => ({
    completedLessons: 0,
    currentLessonId: "lesson-01",
    percent: 0,
    totalLessons: 13,
  }));

  const refresh = () => {
    const repository = getBrowserProjectRepository();
    if (!repository) {
      setActiveProject(null);
      setProjectCount(0);
      return;
    }
    const project = repository.initializeSeedProject();
    setActiveProject(project);
    setProjectCount(repository.list().length);
    setCourseProgress(readCourseProgressSummary(courseId, 13));
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener(PROJECT_UPDATED_EVENT, refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PROJECT_UPDATED_EVENT, refresh);
    };
  }, []);

  const currentLesson = useMemo(
    () =>
      lessons.find((lesson) => lesson.id === courseProgress.currentLessonId) ??
      lessons[0],
    [courseProgress.currentLessonId, lessons],
  );
  const latestArtifact = activeProject
    ? [...activeProject.artifacts].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )[0]
    : null;
  const currentVersion = activeProject?.versions.at(-1);

  const createProject = () => {
    const repository = getBrowserProjectRepository();
    if (!repository || newTitle.trim().length < 2) return;
    const result = createActiveProject(repository, newTitle);
    router.push(result.workbenchPath);
  };

  return (
    <>
      <DashboardHeader
        action={{ label: "管理全部作品", href: "/student/projects" }}
        description="从当前持续项目继续课程、创造、测试和保存版本。"
        eyebrow="造物星球 · 创造基地"
        title={`${studentName}，今天准备创造什么？`}
      />
      <DemoNotice>
        创造基地、我的作品、课程页和创造台读取同一个 ProjectRepository。
      </DemoNotice>

      {activeProject ? (
        <>
          <StatGrid
            items={[
              {
                label: "13课总体进度",
                value: `${courseProgress.percent}%`,
                detail: `${courseProgress.completedLessons}/13 课完成`,
                symbol: "进",
              },
              {
                label: "当前课次",
                value: currentLesson
                  ? String(currentLesson.order).padStart(2, "0")
                  : "01",
                detail: currentLesson?.title ?? "一句话唤醒第一个网页",
                symbol: "课",
              },
              {
                label: "造物档案",
                value: activeProject.artifacts.length,
                detail: latestArtifact?.name ?? "等待首次保存",
                symbol: "档",
              },
              {
                label: "当前版本",
                value: currentVersion?.label ?? "草稿",
                detail: `${activeProject.versions.length} 个快照`,
                symbol: "版",
              },
            ]}
          />

          <section className="active-project-hero">
            <div>
              <span>当前持续项目</span>
              <h2>{activeProject.title}</h2>
              <p>
                最近修改：
                {new Date(activeProject.updatedAt).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="active-project-actions">
              <Link href={`/student/workbench/${activeProject.projectId}`}>
                继续创造 →
              </Link>
              <Link href={`/learn/${courseId}/${currentLesson?.id ?? "lesson-01"}`}>
                进入当前课程
              </Link>
              <button onClick={() => setShowCreate((value) => !value)} type="button">
                新建项目
              </button>
            </div>
          </section>

          {showCreate && (
            <section className="creation-base-new-project">
              <label>
                新项目名称
                <input
                  autoFocus
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="例如：校园失物招领站"
                  value={newTitle}
                />
              </label>
              <button
                disabled={newTitle.trim().length < 2}
                onClick={createProject}
                type="button"
              >
                创建并进入创造台
              </button>
              <span>新项目会自动设为当前持续项目。</span>
            </section>
          )}

          <div className="dashboard-columns">
            <DashboardPanel
              description="课程进度与项目正文分层保存"
              title="当前学习进度"
            >
              <ProgressBar
                label="13课总体进度"
                value={courseProgress.percent}
              />
              <div className="metric-notes">
                <p>
                  <span>当前所在课次</span>
                  <b>
                    第 {currentLesson?.order ?? 1} 课 ·{" "}
                    {currentLesson?.title ?? "一句话唤醒第一个网页"}
                  </b>
                </p>
                <p>
                  <span>学生端任务</span>
                  <b>{currentLesson?.studentSubtitle ?? "首次登陆任务"}</b>
                </p>
              </div>
            </DashboardPanel>
            <DashboardPanel
              description="来自当前 ProjectDocument，不读取模拟作品"
              title="最近造物档案"
            >
              {latestArtifact ? (
                <div className="data-list">
                  <article className="data-row">
                    <span className="data-row-mark">档</span>
                    <div>
                      <b>{latestArtifact.name}</b>
                      <small>
                        更新于{" "}
                        {new Date(latestArtifact.updatedAt).toLocaleString("zh-CN")}
                      </small>
                    </div>
                    <span className="status-chip">{latestArtifact.type}</span>
                  </article>
                </div>
              ) : (
                <div className="project-empty-note">
                  还没有造物档案。进入课程或创造台完成首次保存后会显示在这里。
                </div>
              )}
            </DashboardPanel>
          </div>

          <DashboardPanel
            description="当前已实现的正式样板课"
            title="学习中心"
          >
            <div className="student-course-grid">
              {lessons.map((lesson) => (
                <article
                  key={lesson.id}
                  style={{ "--course-color": lesson.color } as React.CSSProperties}
                >
                  <div className="student-course-top">
                    <span>{String(lesson.order).padStart(2, "0")}</span>
                    <small>{lesson.badge}</small>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.studentSubtitle}</p>
                  <div className="skill-list">
                    {lesson.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <Link
                    className="course-link"
                    href={`/learn/${courseId}/${lesson.id}`}
                  >
                    进入任务舱 <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </>
      ) : (
        <section className="no-active-project">
          <div>
            <span>还没有当前持续项目</span>
            <h2>创建项目，或从我的作品选择一个项目</h2>
            <p>课程和创造台会自动使用你选择的当前项目。</p>
          </div>
          <label>
            项目名称
            <input
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="例如：喝水提醒站"
              value={newTitle}
            />
          </label>
          <button
            disabled={newTitle.trim().length < 2}
            onClick={createProject}
            type="button"
          >
            创建项目
          </button>
          <Link href="/student/projects">
            从我的作品选择{projectCount > 0 ? `（${projectCount}）` : ""}
          </Link>
        </section>
      )}
    </>
  );
}
