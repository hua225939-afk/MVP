"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import type { lessonSummaries } from "@/lib/lesson-loader";
import { getLesson } from "@/lib/lesson-loader";
import { progressPercent, readProgress } from "@/lib/progress-storage";

type LessonSummary = (typeof lessonSummaries)[number];
const courseIcons = ["</>", "✦", "{ }"];
const courseId = "vibe-coding-foundations";
const studentStepCaptions = [
  "发现案例",
  "解码原理",
  "设计任务",
  "进入创造台",
  "进行试航",
  "记录档案",
];

export function CourseHome({ lessons }: { lessons: LessonSummary[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(
        Object.fromEntries(
          lessons.map((lesson) => {
            const content = getLesson(lesson.id);
            return [
              lesson.id,
              content
                ? progressPercent(
                    readProgress(courseId, content),
                    content.steps.length,
                  )
                : 0,
            ];
          }),
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
            {brand.platformName}
            <small>{brand.platformSubtitle}</small>
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
            {brand.studentSpaceName} · {brand.courseSeriesName}
          </div>
          <h1>
            不只是学代码，
            <br />
            更是把<span>奇思妙想</span>做出来
          </h1>
          <p>
            跟着造物领航员，用“发现、解码、设计、创造、试航、记录”六个环节，
            在任务舱中完成真正可以操作和调整的网页作品。
          </p>
          <div className="hero-actions">
            <Link
              className="button button-primary button-large"
              href={`/learn/${courseId}/lesson-01`}
            >
              进入首次登陆任务 <span>→</span>
            </Link>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>🧑🏻‍💻</span>
                <span>👩🏻‍🚀</span>
                <span>🧑🏻‍🎨</span>
              </div>
              <p>
                <b>创造台已就绪</b>
                <small>选择、填写、调整、试航</small>
              </p>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="六步学习旅程">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="journey-card">
            <div className="journey-top">
              <span>{brand.studentSpaceName}任务进度</span>
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
                  <small>{studentStepCaptions[index]}</small>
                </div>
              ))}
            </div>
            <div className="coach-bubble">
              <span className="coach-avatar">AI</span>
              <p>
                <b>嗨，我是造物领航员</b>
                <small>遇到故障别着急，创造助手会给你线索。</small>
              </p>
              <span className="spark">✦</span>
            </div>
          </div>
        </div>
      </section>

      <section className="course-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">任务舱列表</span>
            <h2>从网页首次登陆，到发布完整应用</h2>
          </div>
          <p>每节 90—150 分钟 · 随时停下 · 自动续学</p>
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
                  <span className="course-number">
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <span className="course-icon">
                    {courseIcons[index % courseIcons.length]}
                  </span>
                  <span className="course-badge">{lesson.badge}</span>
                </div>
                <div className="course-card-body">
                  <div className="course-meta">
                    <span>{lesson.level}</span>
                    <span>·</span>
                    <span>{lesson.duration}</span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p className="course-subtitle">{lesson.studentSubtitle}</p>
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
                  <Link
                    className="course-link"
                    href={`/learn/${courseId}/${lesson.id}`}
                  >
                    {percent > 0 ? "继续任务" : "进入任务舱"}
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
          <span>{brand.platformName}</span>
        </div>
        <p>保持好奇，勇敢创造。你的每一个想法都值得被实现。</p>
      </footer>
    </main>
  );
}
