import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { getTeacherDashboard } from "@/data/mock/platform-data";

export default function TeacherPage() {
  const dashboard = getTeacherDashboard();

  return (
    <RoleShell roleId="teacher">
      <DashboardHeader
        description="查看自己的班级、学生学习进度与示例作品。"
        eyebrow="教师工作台"
        title={`${dashboard.teacher.name}，今天一起看看学习进展`}
      />
      <DemoNotice>
        当前数据为只读演示。课程预览能力将在样板课阶段接入只读进度边界。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "我的班级", value: dashboard.stats.classes, detail: "本人任教范围", symbol: "班" },
          { label: "学生", value: dashboard.stats.students, detail: "班级关联学生", symbol: "学" },
          { label: "平均进度", value: `${dashboard.stats.completion}%`, detail: "本人班级平均值", symbol: "进" },
          { label: "课程作品", value: dashboard.stats.works, detail: "草稿与完成作品", symbol: "作" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="只显示当前教师任教范围" id="classes" title="我的班级">
          <div className="data-list">
            {dashboard.classes.map((classItem) => (
              <article className="data-row" key={classItem.id}>
                <span className="data-row-mark">班</span>
                <div>
                  <b>{classItem.name}</b>
                  <small>{classItem.schedule} · {classItem.room}</small>
                </div>
                <span className="status-chip status-active">进行中</span>
              </article>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel description="由学生进度明细计算" title="班级进度">
          <ProgressBar label="学生平均学习进度" value={dashboard.stats.completion} />
          <div className="metric-notes">
            <p><span>进度 ≥ 80%</span><b>{dashboard.students.filter((item) => item.percent >= 80).length} 人</b></p>
            <p><span>继续学习中</span><b>{dashboard.students.filter((item) => item.percent < 100).length} 人</b></p>
          </div>
        </DashboardPanel>
      </div>
      <DashboardPanel description="进度仅供本阶段演示" id="students" title="学生学习情况">
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr><th>学生</th><th>当前课次</th><th>已完成课次</th><th>总体进度</th></tr>
            </thead>
            <tbody>
              {dashboard.students.map((student) => (
                <tr key={student.studentId}>
                  <td><b>{student.studentName}</b></td>
                  <td>{student.currentLessonId}</td>
                  <td>{student.completedLessons} / 3</td>
                  <td><ProgressBar value={student.percent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
      <DashboardPanel description="本阶段不写入正式教师评价" id="works" title="学生作品">
        <div className="compact-card-grid">
          {dashboard.works.map((work) => (
            <article className="compact-card" key={work.id}>
              <span className="compact-card-index">作</span>
              <div>
                <small>{work.studentName} · {work.lessonId}</small>
                <h3>{work.title}</h3>
                <p>更新于 {work.updatedAt}</p>
              </div>
              <span className="status-chip">{work.status}</span>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </RoleShell>
  );
}
