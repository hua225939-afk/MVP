"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LessonRenderer } from "@/components/lesson/LessonRenderer";
import type { Lesson } from "@/lib/lesson-schema";
import {
  emptyProgress,
  progressPercent,
  readProgress,
  writeProgress,
  type InteractionProgress,
  type LessonProgress,
} from "@/lib/progress-storage";
import { getBrowserProjectRepository } from "@/lib/projects/project-repository";
import {
  mergeProjectIntoLessonProgress,
  syncLessonProgressToProject,
} from "@/lib/projects/lesson-project-sync";

const stepIcons = ["◉", "▤", "◇", "✦", "✓", "◌"];
const studentStepCaptions = [
  "发现案例",
  "解码原理",
  "设计任务",
  "进入创造台",
  "进行试航",
  "记录造物档案",
];
const previewStepCaptions = [
  "看案例",
  "懂原理",
  "拆任务",
  "动手做",
  "运行测试",
  "讲出理解",
];

export function LessonExperience({
  lesson,
  readOnly = false,
}: {
  lesson: Lesson;
  readOnly?: boolean;
}) {
  const [progress, setProgress] = useState<LessonProgress>(() => emptyProgress(lesson));
  const [ready, setReady] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>();
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (readOnly) {
        setProgress(emptyProgress(lesson));
      } else {
        const repository = getBrowserProjectRepository();
        const currentProjectId = lesson.id === "lesson-01"
          ? repository?.initializeSeedProject().projectId
          : repository?.getActiveProjectId();
        setActiveProjectId(currentProjectId ?? null);
        const saved = readProgress(lesson.courseId, lesson);
        const merged = mergeProjectIntoLessonProgress(lesson, saved);
        setProgress(merged);
        if (merged !== saved) {
          writeProgress(lesson.courseId, lesson.id, merged);
        } else {
          syncLessonProgressToProject(lesson.id, saved);
        }
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lesson, readOnly]);

  const currentStepIndex = Math.max(
    0,
    lesson.steps.findIndex((item) => item.id === progress.currentStepId),
  );
  const step = lesson.steps[currentStepIndex];
  const percent = progressPercent(progress, lesson.steps.length);
  const stepComplete = progress.completedStepIds.includes(step.id);
  const interactionsComplete = useMemo(
    () =>
      step.completion.requiredAtomIds.every(
        (atomId) => progress.interactions[atomId]?.completed,
      ),
    [progress.interactions, step.completion.requiredAtomIds],
  );

  const save = (updater: (current: LessonProgress) => LessonProgress) => {
    setProgress((current) => {
      const next = updater(current);
      if (!readOnly) {
        writeProgress(lesson.courseId, lesson.id, next);
        syncLessonProgressToProject(lesson.id, next);
      }
      return next;
    });
  };

  const goToStep = (index: number) => {
    setHintIndex(0);
    save((current) => ({
      ...current,
      currentStepId: lesson.steps[index].id,
      status: current.status === "not_started" ? "in_progress" : current.status,
      startedAt: current.startedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateInteraction = (atomId: string, next: InteractionProgress) => {
    const currentAtomStepId = lesson.steps.find((lessonStep) =>
      lessonStep.atoms.some((atom) => atom.id === atomId),
    )?.id;
    const dependentAtoms = lesson.steps.flatMap((lessonStep) =>
      lessonStep.atoms
        .filter(
          (atom) => "sourceAtomId" in atom && atom.sourceAtomId === atomId,
        )
        .map((atom) => ({ atomId: atom.id, stepId: lessonStep.id })),
    );
    save((current) => {
      const interactions = { ...current.interactions, [atomId]: next };
      dependentAtoms.forEach((dependent) => {
        delete interactions[dependent.atomId];
      });
      const dependentStepIds = new Set(
        dependentAtoms.map((dependent) => dependent.stepId),
      );
      if (!next.completed && currentAtomStepId) {
        dependentStepIds.add(currentAtomStepId);
      }
      return {
        ...current,
        status:
          dependentAtoms.length > 0 && current.status === "completed"
            ? "in_progress"
            : current.status === "not_started"
              ? "in_progress"
              : current.status,
        startedAt: current.startedAt ?? new Date().toISOString(),
        completedStepIds: current.completedStepIds.filter(
          (stepId) => !dependentStepIds.has(stepId),
        ),
        interactions,
        completedAt: dependentAtoms.length > 0 ? null : current.completedAt,
        updatedAt: next.updatedAt,
      };
    });
  };

  const finishStep = () => {
    const now = new Date().toISOString();
    save((current) => {
      const completedStepIds = current.completedStepIds.includes(step.id)
        ? current.completedStepIds
        : [...current.completedStepIds, step.id];
      const lessonComplete = completedStepIds.length === lesson.steps.length;
      return {
        ...current,
        status: lessonComplete ? "completed" : "in_progress",
        completedStepIds,
        currentStepId:
          lesson.steps[Math.min(currentStepIndex + 1, lesson.steps.length - 1)].id,
        startedAt: current.startedAt ?? now,
        updatedAt: now,
        completedAt: lessonComplete ? now : null,
      };
    });
    setHintIndex(0);
  };

  return (
    <main className="lesson-shell">
      <header className="lesson-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>
            Vibe Coding
            <small>把想法变成作品</small>
          </span>
        </Link>
        <div className="lesson-title-center">
          <span>
            第 {String(lesson.order).padStart(2, "0")} 课
            {readOnly ? " · 教师只读预览" : " · 任务舱"}
          </span>
          <b>{lesson.title}</b>
          {!readOnly && <small>{lesson.studentSubtitle}</small>}
        </div>
        <Link className="exit-link" href={readOnly ? "/teacher" : "/student/courses"}>
          <span>⌂</span> {readOnly ? "教师工作台" : "创造基地"}
        </Link>
      </header>

      <nav className="step-nav" aria-label="学习步骤">
        {lesson.steps.map((item, index) => {
          const completed = progress.completedStepIds.includes(item.id);
          const active = index === currentStepIndex;
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={`${active ? "step-active" : ""} ${completed ? "step-done" : ""}`}
              key={item.id}
              onClick={() => goToStep(index)}
              type="button"
            >
              <span className="step-icon">{completed ? "✓" : stepIcons[index]}</span>
              <span>
                <b>{item.phase}</b>
                <small>
                  {(readOnly ? previewStepCaptions : studentStepCaptions)[index]}
                </small>
              </span>
              {index < lesson.steps.length - 1 && <i />}
            </button>
          );
        })}
      </nav>

      <div className="lesson-progress-bar">
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="lesson-workspace">
        <aside className="coach-column">
          <section className="coach-card teacher-card">
            <div className="coach-card-heading">
              <span className="teacher-avatar">AI</span>
              <div>
                <b>{readOnly ? "AI 老师 · 小紫" : "造物领航员 · 小紫"}</b>
                <small>
                  <span className="online-dot" /> 预设教学讲解
                </small>
              </div>
            </div>
            <div className="teacher-scene">
              <span className="teacher-face">✦</span>
              <div className="speech-line speech-line-one" />
              <div className="speech-line speech-line-two" />
              <span className="scene-code">&lt;/&gt;</span>
            </div>
            <div className="coach-content">
              <span className="coach-kicker">
                {readOnly ? "AI 老师讲解" : "领航员解码"}
              </span>
              <h3>{step.title}</h3>
              <p>{step.assistant.message}</p>
              <div className="key-point">
                <span>💡</span>
                <p>
                  <b>本步目标</b>
                  {step.goal}
                </p>
              </div>
            </div>
          </section>

          <section className="coach-card assistant-card">
            <div className="assistant-heading">
              <span>✦</span>
              <div>
                <b>{readOnly ? "教师教学提示" : "创造助手"}</b>
                <small>{readOnly ? "只读查看，不写入学生进度" : "卡住时点我一下"}</small>
              </div>
            </div>
            <p>
              {readOnly
                ? step.teacherNotes.purpose
                : step.studentContent.instructions}
            </p>
            <div className="hint-box">
              <span>提示 {hintIndex + 1}</span>
              <p>
                {readOnly
                  ? step.teacherNotes.observeFor[
                      hintIndex % step.teacherNotes.observeFor.length
                    ]
                  : step.assistant.hints[hintIndex]}
              </p>
            </div>
            <button
              className="button button-ghost"
              onClick={() =>
                setHintIndex((current) =>
                  (current + 1) %
                  (readOnly
                    ? step.teacherNotes.observeFor.length
                    : step.assistant.hints.length),
                )
              }
              type="button"
            >
              换一个提示 <span>↻</span>
            </button>
          </section>
        </aside>

        <section className="lesson-main">
          {!readOnly && (
            <div className="task-deck-label">
              <span>任务舱 · 创造台</span>
              {activeProjectId ? (
                <Link href={`/student/workbench/${activeProjectId}`}>
                  打开完整创造台 →
                </Link>
              ) : (
                <Link href="/student/projects">先选择造物项目 →</Link>
              )}
            </div>
          )}
          <div className="lesson-main-heading">
            <div>
              <span className="step-pill">
                第 {currentStepIndex + 1} 步 · {step.phase}
              </span>
              <h1>{step.title}</h1>
              <p>{step.studentContent.intro}</p>
            </div>
            <div className="goal-card">
              <span>本步目标</span>
              <b>{step.goal}</b>
            </div>
          </div>

          {!ready ? (
            <div className="loading-card">
              {readOnly ? "正在打开教师预览…" : "正在接上你的学习进度…"}
            </div>
          ) : !readOnly && !activeProjectId ? (
            <div className="lesson-project-required">
              <span>需要一个当前持续项目</span>
              <h3>先创建或选择项目，再开始本课创造</h3>
              <p>
                本课成果会写入当前 ProjectDocument，不能保存为独立的单课作品。
              </p>
              <div>
                <Link href="/student">去创造基地创建</Link>
                <Link href="/student/projects">从我的作品选择</Link>
              </div>
            </div>
          ) : (
            <LessonRenderer
              atoms={step.atoms}
              onChange={updateInteraction}
              progress={progress.interactions}
              readOnly={readOnly}
            />
          )}

          <div className="lesson-actions">
            <button
              className="button button-secondary"
              disabled={currentStepIndex === 0}
              onClick={() => goToStep(currentStepIndex - 1)}
              type="button"
            >
              ← 上一步
            </button>
            <div className="completion-note">
              {readOnly ? (
                <span>只读预览：操作结果不会保存</span>
              ) : stepComplete ? (
                <span className="complete-text">✓ 本步骤已完成，进度已保存</span>
              ) : interactionsComplete ? (
                <span>{step.studentContent.completionMessage}</span>
              ) : (
                <span>完成上方必做互动后即可进入下一步</span>
              )}
            </div>
            {currentStepIndex < lesson.steps.length - 1 ? (
              <button
                className="button button-primary"
                disabled={!interactionsComplete}
                onClick={finishStep}
                type="button"
              >
                保存本环节，继续 →
              </button>
            ) : (
              <button
                className="button button-primary"
                disabled={!interactionsComplete || stepComplete}
                onClick={finishStep}
                type="button"
              >
                {stepComplete ? "造物档案已保存 ✓" : "保存造物档案 ✓"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
