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

const stepIcons = ["◉", "▤", "◇", "✦", "✓", "◌"];
const stepCaptions = ["先观察", "听明白", "动脑筋", "亲手做", "跑测试", "讲出来"];

export function LessonExperience({ lesson }: { lesson: Lesson }) {
  const [progress, setProgress] = useState<LessonProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(readProgress(lesson.id));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lesson.id]);

  const step = lesson.steps[progress.currentStep] ?? lesson.steps[0];
  const percent = progressPercent(progress);
  const stepComplete = progress.completedSteps.includes(step.id);
  const interactionsComplete = useMemo(
    () => step.blocks.every((block) => progress.interactions[block.id]?.completed),
    [progress.interactions, step.blocks],
  );

  const save = (updater: (current: LessonProgress) => LessonProgress) => {
    setProgress((current) => {
      const next = updater(current);
      writeProgress(lesson.id, next);
      return next;
    });
  };

  const goToStep = (index: number) => {
    setHintIndex(0);
    save((current) => ({ ...current, currentStep: index }));
  };

  const updateInteraction = (blockId: string, next: InteractionProgress) => {
    save((current) => ({
      ...current,
      interactions: { ...current.interactions, [blockId]: next },
    }));
  };

  const finishStep = () => {
    save((current) => {
      const completedSteps = current.completedSteps.includes(step.id)
        ? current.completedSteps
        : [...current.completedSteps, step.id];
      return {
        ...current,
        completedSteps,
        currentStep: Math.min(current.currentStep + 1, lesson.steps.length - 1),
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
            第 {lesson.order} 课 · {lesson.badge}
          </span>
          <b>{lesson.title}</b>
        </div>
        <Link className="exit-link" href="/">
          <span>⌂</span> 课程首页
        </Link>
      </header>

      <nav className="step-nav" aria-label="学习步骤">
        {lesson.steps.map((item, index) => {
          const completed = progress.completedSteps.includes(item.id);
          const active = index === progress.currentStep;
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
                <b>{item.type}</b>
                <small>{stepCaptions[index]}</small>
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
                <b>AI 老师 · 小紫</b>
                <small>
                  <span className="online-dot" /> 正在陪你学习
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
              <span className="coach-kicker">现在要做什么</span>
              <h3>{step.teacher.title}</h3>
              <p>{step.teacher.message}</p>
              <div className="key-point">
                <span>💡</span>
                <p>
                  <b>记住这一点</b>
                  {step.teacher.keyPoint}
                </p>
              </div>
            </div>
          </section>

          <section className="coach-card assistant-card">
            <div className="assistant-heading">
              <span>✦</span>
              <div>
                <b>AI 学习助手</b>
                <small>卡住时点我一下</small>
              </div>
            </div>
            <p>{step.assistant.message}</p>
            <div className="hint-box">
              <span>提示 {hintIndex + 1}</span>
              <p>{step.assistant.hints[hintIndex]}</p>
            </div>
            <button
              className="button button-ghost"
              onClick={() =>
                setHintIndex((current) => (current + 1) % step.assistant.hints.length)
              }
              type="button"
            >
              换一个提示 <span>↻</span>
            </button>
          </section>
        </aside>

        <section className="lesson-main">
          <div className="lesson-main-heading">
            <div>
              <span className="step-pill">
                第 {progress.currentStep + 1} 步 · {step.type}
              </span>
              <h1>{step.title}</h1>
              <p>{step.intro}</p>
            </div>
            <div className="goal-card">
              <span>本步目标</span>
              <b>{step.goal}</b>
            </div>
          </div>

          {!ready ? (
            <div className="loading-card">正在接上你的学习进度…</div>
          ) : (
            <LessonRenderer
              blocks={step.blocks}
              onChange={updateInteraction}
              progress={progress.interactions}
            />
          )}

          <div className="lesson-actions">
            <button
              className="button button-secondary"
              disabled={progress.currentStep === 0}
              onClick={() => goToStep(progress.currentStep - 1)}
              type="button"
            >
              ← 上一步
            </button>
            <div className="completion-note">
              {stepComplete ? (
                <span className="complete-text">✓ 本步骤已完成，进度已保存</span>
              ) : interactionsComplete ? (
                <span>互动完成，可以继续啦！</span>
              ) : (
                <span>完成上方互动后即可进入下一步</span>
              )}
            </div>
            {progress.currentStep < lesson.steps.length - 1 ? (
              <button
                className="button button-primary"
                disabled={!interactionsComplete}
                onClick={finishStep}
                type="button"
              >
                完成本步，继续 →
              </button>
            ) : (
              <button
                className="button button-primary"
                disabled={!interactionsComplete}
                onClick={finishStep}
                type="button"
              >
                {percent === 100 ? "课程已完成 ✓" : "完成课程 ✓"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
