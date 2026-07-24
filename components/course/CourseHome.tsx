"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { lessonSummaries } from "@/lib/lesson-loader";
import { progressPercent, readProgress } from "@/lib/progress-storage";

type LessonSummary = (typeof lessonSummaries)[number];
const courseIcons = ["</>", "✦", "{ }"];

export function CourseHome({ lessons }: { lessons: LessonSummary[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(
        Object.fromEntries(
          lessons.map((lesson) => [lesson.id, progressPercent(readProgress(lesson.id))]),
        ),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lessons]);

  const total = lessons.length
    ? Math.round(
        lessons.reduce((sum, lesson) => sum + (progress[lesson.id] ?? 0), 0) /
          lessons.length,
      )
    : 0;

  return (
    <main className="home-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>
            Vibe Coding
            <small>把想法变成作品</small>
          </span>
        </Link>
        <div className="header-status">
          <span className="status-dot" />
          学习进度已保存在本设备
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>✦</span>
            适合小学高年级与初中生
          </div>
          <h1>
            不只是学代码，
            <br />
            更是把<span>奇思妙想</span>做出来
          </h1>
          <p>
            跟着 AI 老师，用“看、讲、想、做、测、说”六个步骤，
            一小步一小步完成你的第一个互动网页。
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/lessons/lesson-01">
              开始第一课 <span>→</span>
            </Link>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>🧑🏻‍💻</span>
                <span>👩🏻‍🚀</span>
                <span>🧑🏻‍🎨</span>
              </div>
              <p>
                <b>六步学习法</b>
                <small>每一步都有清晰反馈</small>
              </p>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="六步学习旅程">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="journey-card">
            <div className="journey-top">
              <span>我的学习旅程</span>
              <b>{total}%</b>
            </div>
            <div className="journey-progress">
              <span style={{ width: `${total}%` }} />
            </div>
            <div className="journey-steps">
              {["看", "讲", "想", "做", "测", "说"].map((step, index) => (
                <div className={index === 0 ? "journey-step-active" : ""} key={step}>
                  <span>{["◉", "◫", "◇", "✦", "✓", "◌"][index]}</span>
                  <b>{step}</b>
                  <small>{["先观察", "听明白", "动脑筋", "亲手做", "跑测试", "讲出来"][index]}</small>
                </div>
              ))}
            </div>
            <div className="coach-bubble">
              <span className="coach-avatar">AI</span>
              <p>
                <b>嗨，我是你的 AI 老师</b>
                <small>遇到问题别着急，我们一起把它拆小。</small>
              </p>
              <span className="spark">✦</span>
            </div>
          </div>
        </div>
      </section>

      <section className="course-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">学习路线</span>
            <h2>三节课，做出第一个互动网页</h2>
          </div>
          <p>每节约 30 分钟 · 随时停下 · 自动续学</p>
        </div>

        <div className="course-grid">
          {lessons.map((lesson, index) => {
            const percent = progress[lesson.id] ?? 0;
            return (
              <article className="course-card" key={lesson.id}>
                <div
                  className="course-card-cover"
                  style={{ "--course-color": lesson.color } as React.CSSProperties}
                >
                  <span className="course-number">0{lesson.order}</span>
                  <span className="course-icon">{courseIcons[index]}</span>
                  <span className="course-badge">{lesson.badge}</span>
                </div>
                <div className="course-card-body">
                  <div className="course-meta">
                    <span>{lesson.level}</span>
                    <span>·</span>
                    <span>{lesson.duration}</span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p className="course-subtitle">{lesson.subtitle}</p>
                  <p>{lesson.description}</p>
                  <div className="skill-list">
                    {lesson.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <div className="card-progress">
                    <div>
                      <span>学习进度</span>
                      <b>{percent}%</b>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <Link className="course-link" href={`/lessons/${lesson.id}`}>
                    {percent > 0 ? "继续学习" : "进入课程"}
                    <span>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand brand-muted">
          <span className="brand-mark">V</span>
          <span>Vibe Coding</span>
        </div>
        <p>保持好奇，勇敢创造。你的每一个想法都值得被实现。</p>
      </footer>
    </main>
  );
}
