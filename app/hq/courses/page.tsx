import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { course, lessons } from "@/lib/lesson-loader";
import { courseToolRegistry } from "@/lib/tools/course-tool-registry";

export default function HeadquartersCoursesPage() {
  return (
    <RoleShell roleId="hq">
      <DashboardHeader
        action={{ label: "查看组件库", href: "/hq/components" }}
        description="只读查看课程 JSON 中的 5 个单元、13 课、步骤与工具绑定。"
        eyebrow="总部 · 课程管理 · 演示数据"
        title="课程结构与 Schema 状态"
      />
      <DemoNotice>
        本页直接读取已经通过 Zod 的 Course/Lesson 数据；不提供在线编辑、删除或发布课程能力。
      </DemoNotice>
      <div className="course-plan-summary">
        <span><b>{course.units.length}</b> 个单元</span>
        <span><b>{lessons.length}</b> 节课程</span>
        <span><b>{lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0)}</b> 个课程步骤</span>
        <span><b>{courseToolRegistry.length}</b> 个创造工具</span>
        <span><b>通过</b> Schema 验证</span>
      </div>
      <div className="unit-grid">
        {course.units.map((unit) => (
          <DashboardPanel
            description={unit.description}
            key={unit.id}
            title={`单元 ${unit.order} · ${unit.title}`}
          >
            <div className="lesson-plan-list lesson-plan-detailed">
              {unit.lessonIds.map((lessonId) => {
                const lesson = lessons.find((item) => item.id === lessonId);
                const tool = courseToolRegistry.find(
                  (item) => item.lessonId === lessonId,
                );
                if (!lesson) return null;
                return (
                  <article key={lesson.id}>
                    <span>{String(lesson.order).padStart(2, "0")}</span>
                    <div>
                      <b>{lesson.title}</b>
                      <small>
                        {lesson.steps.map((step) => step.phase).join(" → ")}
                      </small>
                      <small>
                        使用工具：{tool?.name ?? "暂无工具绑定"} · 内容 Schema：通过
                      </small>
                    </div>
                    <span className="status-chip status-active">
                      {lesson.steps.length} 步
                    </span>
                  </article>
                );
              })}
            </div>
          </DashboardPanel>
        ))}
      </div>
    </RoleShell>
  );
}
