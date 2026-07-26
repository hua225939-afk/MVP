import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  EmptyState,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { getParentDashboard } from "@/data/mock/platform-data";
import { lessonSummaries } from "@/lib/lesson-loader";

export const metadata = { title: "家长" };

export default function ParentPage() {
  const dashboard = getParentDashboard();

  return (
    <RoleShell roleId="parent">
      <DashboardHeader
        description={`查看 ${dashboard.student.name} 的学习进度、课程成果与可见教师反馈。`}
        eyebrow="家长看板"
        title={`${dashboard.student.name}的学习成长`}
      />
      <DemoNotice>
        当前为家长演示视图，只展示共享模拟摘要，不显示复杂代码、调试记录或教师内部备注。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "已完成课次", value: dashboard.progress.completedLessons, detail: "两节样板课", symbol: "✓" },
          { label: "学习进度", value: `${dashboard.progress.percent}%`, detail: "模拟学习摘要", symbol: "进" },
          { label: "课程成果", value: dashboard.works.length, detail: "允许家长查看", symbol: "作" },
          { label: "教师反馈", value: dashboard.feedback.length, detail: "家长可见内容", symbol: "评" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="来自统一学生学习摘要" id="progress" title="学习进度">
          <ProgressBar label="样板课程总体进度" value={dashboard.progress.percent} />
          <div className="metric-notes">
            <p><span>当前学习</span><b>{dashboard.progress.currentLessonId}</b></p>
            <p><span>已完成</span><b>{dashboard.progress.completedLessons} / 2</b></p>
          </div>
        </DashboardPanel>
        <DashboardPanel description="不展示作品代码与调试记录" id="works" title="课程成果">
          <div className="data-list">
            {dashboard.works.map((work) => (
              <article className="data-row" key={work.id}>
                <span className="data-row-mark">作</span>
                <div>
                  <b>{work.title}</b>
                  <small>{work.lessonId} · {work.updatedAt}</small>
                </div>
                <span className="status-chip">{work.status}</span>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
      <DashboardPanel
        description="摘要直接读取课次 JSON，不展示代码与调试细节"
        title="两节课学了什么"
      >
        <div className="compact-card-grid">
          {lessonSummaries.map((lesson) => (
            <article className="compact-card" key={lesson.id}>
              <span className="compact-card-index">
                {String(lesson.order).padStart(2, "0")}
              </span>
              <div>
                <small>{lesson.parentSummary.theme}</small>
                <h3>{lesson.title}</h3>
                <p>{lesson.parentSummary.learned}</p>
                <p><b>学习成果：</b>{lesson.parentSummary.artifact}</p>
              </div>
            </article>
          ))}
        </div>
      </DashboardPanel>
      <DashboardPanel description="仅显示 student_and_parent 可见范围" id="feedback" title="教师反馈">
        {dashboard.feedback.length ? (
          <div className="feedback-list">
            {dashboard.feedback.map((item) => (
              <article key={item.id}>
                <span className="avatar-letter">{item.teacherName.slice(0, 1)}</span>
                <div>
                  <b>{item.teacherName}</b>
                  <small>{item.date}</small>
                  <p>{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState description="教师发布家长可见反馈后会显示在这里。" title="暂无教师反馈" />
        )}
      </DashboardPanel>
    </RoleShell>
  );
}
