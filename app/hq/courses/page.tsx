import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { courseUnits } from "@/data/mock/platform-data";
import { lessonSummaries } from "@/lib/lesson-loader";

export default function HeadquartersCoursesPage() {
  return (
    <RoleShell roleId="hq">
      <DashboardHeader
        action={{ label: "查看组件库", href: "/hq/components" }}
        description="只读查看 5 个单元、13 课规划与当前 MVP 示例内容。"
        eyebrow="总部 · 课程管理"
        title="课程结构"
      />
      <DemoNotice>
        13 课仅展示已确认的课程规划索引；本阶段不会批量生成课次 JSON。当前可体验内容仍为原有 3 节示例课。
      </DemoNotice>
      <div className="course-plan-summary">
        <span><b>5</b> 个单元</span>
        <span><b>13</b> 课规划</span>
        <span><b>{lessonSummaries.length}</b> 节现有示例课</span>
        <span><b>6</b> 步学习节奏</span>
      </div>
      <div className="unit-grid">
        {courseUnits.map((unit, unitIndex) => (
          <DashboardPanel
            description={unit.description}
            key={unit.id}
            title={`单元 ${unitIndex + 1} · ${unit.title}`}
          >
            <div className="lesson-plan-list">
              {unit.lessons.map((lesson) => (
                <article key={lesson.id}>
                  <span>{String(lesson.order).padStart(2, "0")}</span>
                  <div>
                    <b>{lesson.title}</b>
                    <small>{lesson.concept}</small>
                  </div>
                  <span className="status-chip">规划中</span>
                </article>
              ))}
            </div>
          </DashboardPanel>
        ))}
      </div>
      <DashboardPanel
        description="这些内容继续通过原 LessonRenderer 渲染"
        title="现有 MVP 示例课"
      >
        <div className="compact-card-grid">
          {lessonSummaries.map((lesson) => (
            <article className="compact-card" key={lesson.id}>
              <span className="compact-card-index">0{lesson.order}</span>
              <div>
                <small>{lesson.badge}</small>
                <h3>{lesson.title}</h3>
                <p>{lesson.subtitle}</p>
              </div>
              <span className="status-chip status-active">可体验</span>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </RoleShell>
  );
}
