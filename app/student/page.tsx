import Link from "next/link";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { getStudentDashboard } from "@/data/mock/platform-data";
import { lessonSummaries } from "@/lib/lesson-loader";

const courseId = "vibe-coding-foundations";

export default function StudentPage() {
  const dashboard = getStudentDashboard();

  return (
    <RoleShell roleId="student">
      <DashboardHeader
        action={{ label: "进入任务舱", href: "/student/courses" }}
        description="选择任务舱，进入创造台，把想法做成可以试航的网页作品。"
        eyebrow="造物星球 · 创造基地"
        title={`${dashboard.student.name}，今天准备创造什么？`}
      />
      <DemoNotice>
        当前使用演示学生身份。两节样板共用正式课程 JSON、互动注册表、LessonRenderer 和本地进度。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "样板课程", value: lessonSummaries.length, detail: "第 01 / 06 课", symbol: "课" },
          { label: "已完成", value: dashboard.progress.completedLessons, detail: "模拟学习摘要", symbol: "✓" },
          { label: "总体进度", value: `${dashboard.progress.percent}%`, detail: "演示学生数据", symbol: "进" },
          { label: "造物档案", value: dashboard.works.length, detail: "共享模拟作品", symbol: "作" },
        ]}
      />
      <DashboardPanel description="两节完整样板任务均可体验" title="任务舱">
        <div className="student-course-grid">
          {lessonSummaries.map((lesson) => (
            <article key={lesson.id} style={{ "--course-color": lesson.color } as React.CSSProperties}>
              <div className="student-course-top">
                <span>{String(lesson.order).padStart(2, "0")}</span>
                <small>{lesson.badge}</small>
              </div>
              <h3>{lesson.title}</h3>
              <p>{lesson.studentSubtitle}</p>
              <div className="skill-list">
                {lesson.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <Link className="course-link" href={`/learn/${courseId}/${lesson.id}`}>
                进入任务舱 <span>→</span>
              </Link>
            </article>
          ))}
        </div>
      </DashboardPanel>
      <div className="dashboard-columns">
        <DashboardPanel description="演示摘要，不覆盖浏览器内真实课程进度" title="学习进度">
          <ProgressBar label="示例课程总体进度" value={dashboard.progress.percent} />
          <div className="metric-notes">
            <p><span>当前继续</span><b>{dashboard.progress.currentLessonId}</b></p>
            <p><span>本地保存</span><b>已开启</b></p>
          </div>
        </DashboardPanel>
        <DashboardPanel description="作品联动规则仍待产品确认" id="works" title="造物档案">
          <div className="data-list">
            {dashboard.works.map((work) => (
              <article className="data-row" key={work.id}>
                <span className="data-row-mark">作</span>
                <div>
                  <b>{work.title}</b>
                  <small>{work.lessonId} · 更新于 {work.updatedAt}</small>
                </div>
                <span className="status-chip">{work.status}</span>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </RoleShell>
  );
}
