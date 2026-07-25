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
        action={{ label: "打开原课程首页", href: "/student/courses" }}
        description="继续现有三节示例课，学习进度仍保存在本设备。"
        eyebrow="学生学习中心"
        title={`${dashboard.student.name}，把今天的想法做出来吧`}
      />
      <DemoNotice>
        当前使用演示学生身份。新学习路由与原有课程页共用同一份 JSON、LessonRenderer 和本地进度。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "示例课程", value: lessonSummaries.length, detail: "原有 MVP 内容", symbol: "课" },
          { label: "已完成", value: dashboard.progress.completedLessons, detail: "模拟学习摘要", symbol: "✓" },
          { label: "总体进度", value: `${dashboard.progress.percent}%`, detail: "演示学生数据", symbol: "进" },
          { label: "我的作品", value: dashboard.works.length, detail: "共享模拟作品", symbol: "作" },
        ]}
      />
      <DashboardPanel description="原有 3 节示例课均可继续体验" title="继续学习">
        <div className="student-course-grid">
          {lessonSummaries.map((lesson) => (
            <article key={lesson.id} style={{ "--course-color": lesson.color } as React.CSSProperties}>
              <div className="student-course-top">
                <span>0{lesson.order}</span>
                <small>{lesson.badge}</small>
              </div>
              <h3>{lesson.title}</h3>
              <p>{lesson.subtitle}</p>
              <div className="skill-list">
                {lesson.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <Link className="course-link" href={`/learn/${courseId}/${lesson.id}`}>
                进入学习页 <span>→</span>
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
        <DashboardPanel description="作品联动规则仍待产品确认" id="works" title="我的作品">
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
