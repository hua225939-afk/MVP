import Link from "next/link";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import { demoRoles, type DemoRoleId } from "@/data/mock/platform-data";
import {
  demoClassSession,
  demoStudentRecords,
  roleProfiles,
} from "@/data/mock/product-shell-data";

const sectionCopy: Record<string, { title: string; description: string }> = {
  partners: { title: "合作伙伴", description: "查看演示合作伙伴与校区运营关系。" },
  campuses: { title: "校区与班级", description: "查看集中演示数据中的校区、班级和开课状态。" },
  content: { title: "内容状态", description: "查看课程 JSON、Schema 和内容发布边界。" },
  analytics: { title: "数据概览", description: "查看由演示明细计算的课程与项目摘要。" },
  classes: { title: "班级", description: "查看当前校区的班级与课程安排。" },
  teachers: { title: "教师", description: "查看演示教师、所带班级与当前课程。" },
  students: { title: "学生", description: "查看演示班级学生与项目状态摘要。" },
  courses: { title: "课程运营", description: "查看今日课程与班级学习阶段。" },
  progress: { title: "学习进度", description: "查看关联学生的 13 课成长阶段。" },
  works: { title: "作品", description: "查看关联学生当前项目与版本更新。" },
  feedback: { title: "教师评语", description: "查看允许学生与家长读取的教师反馈。" },
  reports: { title: "成长报告", description: "查看由学习、项目和评语生成的演示摘要。" },
  achievements: { title: "成就", description: "查看学习与创造过程中形成的演示里程碑。" },
};

export function RoleSectionPage({
  roleId,
  section,
}: {
  roleId: DemoRoleId;
  section: string;
}) {
  const role = demoRoles.find((item) => item.id === roleId)!;
  const profile = roleProfiles[roleId];
  const copy = sectionCopy[section] ?? {
    title: "演示页面",
    description: "查看当前角色的静态高保真业务摘要。",
  };
  return (
    <>
      <nav aria-label="面包屑" className="dashboard-breadcrumb">
        <Link href={role.href}>{role.name}首页</Link><span>›</span><b>{copy.title}</b>
      </nav>
      <DashboardHeader
        description={copy.description}
        eyebrow={`${role.name}端 · ${copy.title} · 演示数据`}
        title={copy.title}
      />
      <DemoNotice>本页为完整静态演示视图，不提供真实组织管理、账号操作、通知推送或数据修改。</DemoNotice>
      <div className="profile-metric-grid">
        {profile.metrics.map((metric) => <article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.detail}</p></article>)}
      </div>
      <div className="dashboard-columns">
        <DashboardPanel description="来自集中演示班级与用户明细" title={section === "students" ? "学生项目状态" : "当前运营摘要"}>
          <div className="data-list">
            {demoStudentRecords.slice(0, section === "students" ? 4 : 3).map((student) => (
              <article className="data-row" key={student.id}>
                <span className="data-row-mark">{student.avatar}</span>
                <div><b>{student.name} · {student.projectName}</b><small>{student.currentLessonId} · {student.currentStep} · {student.lastSaved}</small></div>
                <span className="status-chip">{student.todoStatus}</span>
              </article>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel description="统一课程与班级关系" title="今日安排">
          <div className="metric-notes">
            <p><span>班级</span><b>{demoClassSession.className}</b></p>
            <p><span>课次</span><b>{demoClassSession.lessonId}</b></p>
            <p><span>时间</span><b>{demoClassSession.schedule}</b></p>
            <p><span>在线创作</span><b>{demoClassSession.onlineCreating} / {demoClassSession.enrolled}</b></p>
          </div>
        </DashboardPanel>
      </div>
      <DashboardPanel description="主要操作在当前阶段保持只读或禁用" title="页面能力说明">
        <div className="static-capability-row">
          <div><span>✓</span><p><b>可以查看</b><small>角色范围内的演示信息、课程与项目摘要</small></p></div>
          <div><span>—</span><p><b>暂不连接</b><small>真实学校数据、账号、消息和数据库</small></p></div>
          <button className="button button-secondary" disabled type="button">管理操作 · 演示功能</button>
        </div>
      </DashboardPanel>
    </>
  );
}
