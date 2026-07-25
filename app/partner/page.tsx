import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { getPartnerDashboard, mockDatabase } from "@/data/mock/platform-data";

export default function PartnerPage() {
  const dashboard = getPartnerDashboard();

  return (
    <RoleShell roleId="partner">
      <DashboardHeader
        description={`查看 ${dashboard.partnerName} 所属校区的教学与运营情况。`}
        eyebrow="合作伙伴运营台"
        title={`你好，${dashboard.partnerName}`}
      />
      <DemoNotice>
        当前合作伙伴范围为固定演示身份，只能查看所属校区的集中模拟数据。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "所属校区", value: dashboard.stats.campuses, detail: "仅当前合作伙伴范围", symbol: "校" },
          { label: "开设班级", value: dashboard.stats.classes, detail: "进行中的课程班", symbol: "班" },
          { label: "授课教师", value: dashboard.stats.teachers, detail: "关联班级教师", symbol: "师" },
          { label: "在读学生", value: dashboard.stats.students, detail: "班级学生明细", symbol: "学" },
          { label: "平均进度", value: `${dashboard.stats.completion}%`, detail: "所属学生平均值", symbol: "进" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="只显示当前合作伙伴范围" id="classes" title="班级列表">
          <div className="data-list">
            {dashboard.classes.map((classItem) => {
              const teacher = mockDatabase.teachers.find((item) => item.id === classItem.teacherId);
              return (
                <article className="data-row" key={classItem.id}>
                  <span className="data-row-mark">班</span>
                  <div>
                    <b>{classItem.name}</b>
                    <small>{teacher?.name} · {classItem.schedule} · {classItem.room}</small>
                  </div>
                  <span className="status-chip status-active">开课中</span>
                </article>
              );
            })}
          </div>
        </DashboardPanel>
        <DashboardPanel description="按所属学生学习记录计算" title="课程进展">
          <ProgressBar label="校区平均学习进度" value={dashboard.stats.completion} />
          <div className="metric-notes">
            {dashboard.campuses.map((campus) => (
              <p key={campus.id}>
                <span>{campus.name}</span>
                <b>{campus.status === "active" ? "运营中" : "筹备中"}</b>
              </p>
            ))}
          </div>
        </DashboardPanel>
      </div>
      <DashboardPanel description="由班级教师关联生成" id="teachers" title="教师团队">
        <div className="compact-card-grid">
          {dashboard.teachers.map((teacher) => {
            const classCount = dashboard.classes.filter((item) => item.teacherId === teacher.id).length;
            return (
              <article className="compact-card" key={teacher.id}>
                <span className="avatar-letter">{teacher.name.slice(0, 1)}</span>
                <div>
                  <small>授课教师</small>
                  <h3>{teacher.name}</h3>
                  <p>负责 {classCount} 个班级</p>
                </div>
              </article>
            );
          })}
        </div>
      </DashboardPanel>
    </RoleShell>
  );
}
