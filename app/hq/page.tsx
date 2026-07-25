import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { RoleShell } from "@/components/platform/RoleShell";
import { getHqDashboard } from "@/data/mock/platform-data";

export default function HeadquartersPage() {
  const dashboard = getHqDashboard();

  return (
    <RoleShell roleId="hq">
      <DashboardHeader
        action={{ label: "查看课程结构", href: "/hq/courses" }}
        description="汇总查看校区、班级、师生与课程使用情况。"
        eyebrow="总部控制台"
        title="平台运营总览"
      />
      <DemoNotice>
        当前为只读演示数据。统计均由共享校区、班级、师生、进度与作品明细计算。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "校区", value: dashboard.stats.campuses, detail: "含筹备中校区", symbol: "校" },
          { label: "班级", value: dashboard.stats.classes, detail: "共享班级明细", symbol: "班" },
          { label: "教师", value: dashboard.stats.teachers, detail: "演示教师档案", symbol: "师" },
          { label: "学生", value: dashboard.stats.students, detail: "班级关联学生", symbol: "学" },
          { label: "平均学习进度", value: `${dashboard.stats.completion}%`, detail: "按学生进度计算", symbol: "进" },
          { label: "课程作品", value: dashboard.stats.works, detail: "草稿与已完成作品", symbol: "作" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="由统一校区与班级数据生成" title="校区概览">
          <div className="data-list">
            {dashboard.campuses.map((campus) => (
              <article className="data-row" key={campus.id}>
                <span className="data-row-mark">{campus.city.slice(0, 1)}</span>
                <div>
                  <b>{campus.name}</b>
                  <small>
                    {campus.city} · {campus.classCount} 个班级 · {campus.studentCount} 名学生
                  </small>
                </div>
                <span className={`status-chip ${campus.status === "active" ? "status-active" : ""}`}>
                  {campus.status === "active" ? "运营中" : "筹备中"}
                </span>
              </article>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel description="现有示例学习记录汇总" title="整体学习进度">
          <ProgressBar label="学生平均完成度" value={dashboard.stats.completion} />
          <div className="metric-notes">
            <p>
              <span>课程作品</span>
              <b>{dashboard.stats.works} 件</b>
            </p>
            <p>
              <span>当前课程框架</span>
              <b>5 单元 / 13 课</b>
            </p>
            <p>
              <span>可体验示例课</span>
              <b>3 节</b>
            </p>
          </div>
        </DashboardPanel>
      </div>
    </RoleShell>
  );
}
