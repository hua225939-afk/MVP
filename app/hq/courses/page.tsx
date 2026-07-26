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
        description="只读查看 5 个单元、13 课规划与两节完整样板内容。"
        eyebrow="总部 · 课程管理"
        title="课程结构"
      />
      <DemoNotice>
        13 课仅展示已确认的课程规划索引；本阶段只完成第 01 / 06 课，不会批量生成其余 11 课。
      </DemoNotice>
      <div className="course-plan-summary">
        <span><b>5</b> 个单元</span>
        <span><b>13</b> 课规划</span>
        <span><b>{lessonSummaries.length}</b> 节完整样板课</span>
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
                  <span
                    className={`status-chip ${
                      lessonSummaries.some((sample) => sample.order === lesson.order)
                        ? "status-active"
                        : ""
                    }`}
                  >
                    {lessonSummaries.some((sample) => sample.order === lesson.order)
                      ? "样板完成"
                      : "规划中"}
                  </span>
                </article>
              ))}
            </div>
          </DashboardPanel>
        ))}
      </div>
      <DashboardPanel
        description="两节课共用正式 Schema、组件注册表和 LessonRenderer"
        title="完整样板课"
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
