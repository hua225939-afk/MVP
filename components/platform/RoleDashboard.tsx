"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
  EmptyState,
  ProgressBar,
  StatGrid,
} from "@/components/platform/DashboardUI";
import { course, lessons } from "@/lib/lesson-loader";
import {
  getBrowserRoleDashboardService,
  RoleDashboardService,
} from "@/lib/platform/role-dashboard-service";
import {
  PLATFORM_UPDATED_EVENT,
  type StudentAttention,
} from "@/lib/platform/platform-repository";
import { PROGRESS_UPDATED_EVENT } from "@/lib/progress-storage";
import { PROJECT_UPDATED_EVENT } from "@/lib/projects/project-repository";
import { courseToolRegistry } from "@/lib/tools/course-tool-registry";

type DashboardRole = "teacher" | "parent" | "partner" | "hq";
type DashboardData =
  | ReturnType<RoleDashboardService["getTeacherDashboard"]>
  | ReturnType<RoleDashboardService["getParentDashboard"]>
  | ReturnType<RoleDashboardService["getPartnerDashboard"]>
  | ReturnType<RoleDashboardService["getHqDashboard"]>;

function createService() {
  const service = getBrowserRoleDashboardService(
    course,
    lessons,
    courseToolRegistry,
  );
  if (!service) throw new Error("当前浏览器数据服务不可用");
  return service;
}

function useDashboard(role: DashboardRole) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const refresh = () => {
      const service = createService();
      setData(
        role === "teacher"
          ? service.getTeacherDashboard()
          : role === "parent"
            ? service.getParentDashboard()
            : role === "partner"
              ? service.getPartnerDashboard()
              : service.getHqDashboard(),
      );
    };
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener(PROJECT_UPDATED_EVENT, refresh);
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh);
    window.addEventListener(PLATFORM_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PROJECT_UPDATED_EVENT, refresh);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh);
      window.removeEventListener(PLATFORM_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [role]);

  return data;
}

export function RoleDashboard({ role }: { role: DashboardRole }) {
  const data = useDashboard(role);
  if (!data) {
    return <div className="dashboard-loading">正在读取当前浏览器的演示数据…</div>;
  }
  if (role === "teacher") {
    return (
      <TeacherDashboard
        data={data as ReturnType<RoleDashboardService["getTeacherDashboard"]>}
      />
    );
  }
  if (role === "parent") {
    return (
      <ParentDashboard
        data={data as ReturnType<RoleDashboardService["getParentDashboard"]>}
      />
    );
  }
  if (role === "partner") {
    return (
      <PartnerDashboard
        data={data as ReturnType<RoleDashboardService["getPartnerDashboard"]>}
      />
    );
  }
  return (
    <HqDashboard
      data={data as ReturnType<RoleDashboardService["getHqDashboard"]>}
    />
  );
}

function TeacherDashboard({
  data,
}: {
  data: ReturnType<RoleDashboardService["getTeacherDashboard"]>;
}) {
  const [summary, setSummary] = useState(data.feedback[0]?.summary ?? "");
  const [savedMessage, setSavedMessage] = useState("");

  const saveFeedback = () => {
    createService().saveTeacherFeedback(summary);
    setSavedMessage("教师评语已写入集中数据层，学生端和家长端现在可以读取。");
  };

  const setAttention = (status: StudentAttention) => {
    createService().setStudentAttention(status);
    setSavedMessage("学生关注标记已更新。");
  };

  const project = data.project;
  return (
    <>
      <DashboardHeader
        description={`只查看 ${data.classRecord.name} 的学生学习过程与当前项目。`}
        eyebrow="教师工作台 · 演示角色"
        title={`${data.identity.name}，查看真实演示学习数据`}
      />
      <DemoNotice>
        数据来自当前浏览器的学生进度与唯一 ProjectRepository。教师评语单独写入平台仓库，不修改学生项目。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "我的班级", value: 1, detail: data.classRecord.name, symbol: "班" },
          { label: "班级学生", value: 1, detail: "仅演示班级范围", symbol: "学" },
          { label: "整体进度", value: `${data.classProgress}%`, detail: `${data.student.completedLessons}/13 课完成`, symbol: "进" },
          { label: "项目版本", value: project?.versions.length ?? 0, detail: project?.versions.at(-1)?.label ?? "暂无版本", symbol: "版" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="13 课实际完成状态" title="学生学习过程">
          <ProgressBar value={data.student.progressPercent} />
          <div className="metric-notes">
            <p><span>学生</span><b>{data.student.name}</b></p>
            <p><span>当前课次</span><b>{data.student.currentLessonId}</b></p>
            <p><span>已完成课程</span><b>{data.student.completedLessons} / 13</b></p>
          </div>
        </DashboardPanel>
        <DashboardPanel description="来自当前 ProjectDocument" title="当前项目">
          {project ? (
            <div className="metric-notes">
              <p><span>项目名称</span><b>{project.title}</b></p>
              <p><span>项目简介</span><b>{project.intent.statement || "尚未填写简介"}</b></p>
              <p><span>发布状态</span><b>{project.publication.status}</b></p>
              <p><span>最近修改</span><b>{new Date(project.updatedAt).toLocaleString("zh-CN")}</b></p>
            </div>
          ) : (
            <EmptyState title="暂无学生项目" description="学生在创造基地创建项目后会显示在这里。" />
          )}
        </DashboardPanel>
      </div>
      <DashboardPanel description="完成状态来自学习进度，产出状态来自进度或项目档案" title="13 课产出">
        <div className="lesson-output-grid">
          {data.student.lessonOutputs.map((item) => (
            <article key={item.id}>
              <span>{item.id.replace("lesson-", "")}</span>
              <div><b>{item.title}</b><small>{item.status}</small></div>
              <i className={item.complete ? "status-chip status-active" : "status-chip"}>
                {item.complete ? "已有产出" : "待完成"}
              </i>
            </article>
          ))}
        </div>
      </DashboardPanel>
      <div className="dashboard-columns">
        <DashboardPanel description="保留原稿、学生修改和最终采用内容" title="AI 草稿与学生修改">
          <div className="comparison-stack">
            <article><small>AI 初始草稿</small><p>{data.comparison.aiDraft || "尚无 AI 初始草稿"}</p></article>
            <article><small>学生修改稿</small><p>{data.comparison.studentRevision || "尚无学生修改稿"}</p></article>
            <article><small>最终采用</small><p>{data.comparison.finalContent || "尚未确认最终内容"}</p></article>
          </div>
        </DashboardPanel>
        <DashboardPanel description="测试、Bug、同伴反馈与版本均来自同一项目" title="项目证据">
          {project ? (
            <div className="metric-notes">
              <p><span>测试结果</span><b>{project.tests.filter((item) => item.status === "pass").length} 通过 / {project.tests.length} 条</b></p>
              <p><span>Bug 与修复</span><b>{project.bugReports.filter((item) => item.status === "resolved").length} 已修复 / {project.bugReports.length} 条</b></p>
              <p><span>同伴反馈</span><b>{project.peerReviews.length + project.feedback.length} 条</b></p>
              <p><span>版本历史</span><b>{project.versions.map((item) => item.label).join(" → ") || "暂无版本"}</b></p>
            </div>
          ) : (
            <p>学生产生测试、Bug、反馈和版本后会显示在这里。</p>
          )}
        </DashboardPanel>
      </div>
      <DashboardPanel description="只提供简短评语与二选一关注标记，不建立复杂评分系统" title="教师跟进">
        <div className="teacher-feedback-form">
          <label>
            面向学生与家长的教师评语
            <textarea
              maxLength={300}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="例如：已经能清楚说明测试如何推动作品修改。"
              rows={4}
              value={summary}
            />
          </label>
          <div>
            <button disabled={summary.trim().length < 2} onClick={saveFeedback} type="button">保存评语</button>
            <button className={data.attention === "needs_attention" ? "is-selected" : ""} onClick={() => setAttention("needs_attention")} type="button">需要关注</button>
            <button className={data.attention === "doing_well" ? "is-selected" : ""} onClick={() => setAttention("doing_well")} type="button">完成良好</button>
          </div>
          {savedMessage && <p className="form-success">{savedMessage}</p>}
        </div>
      </DashboardPanel>
    </>
  );
}

function ParentDashboard({
  data,
}: {
  data: ReturnType<RoleDashboardService["getParentDashboard"]>;
}) {
  if (!data.student) {
    return <EmptyState title="暂无关联学生" description="演示家长建立学生关联后会显示成长摘要。" />;
  }
  const student = data.student;
  return (
    <>
      <DashboardHeader
        description={`只查看与 ${data.identity.name} 关联的 ${student.identity.name}。`}
        eyebrow="家长看板 · 演示角色"
        title={`${student.identity.name}的学习成长`}
      />
      <DemoNotice>
        当前为单浏览器演示摘要，不是实名账号或跨设备数据；不展示复杂代码和技术日志。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "已完成课程", value: `${student.completedLessons}/13`, detail: "由实际完成记录计算", symbol: "✓" },
          { label: "当前阶段", value: student.currentLessonId, detail: `${student.progressPercent}% 总进度`, symbol: "进" },
          { label: "作品版本", value: student.project?.versions.length ?? 0, detail: student.project?.versions.at(-1)?.label ?? "等待保存版本", symbol: "版" },
          { label: "教师评语", value: student.feedback.length, detail: "家长可见评语", symbol: "评" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="最近完成或正在进行的任务" id="progress" title="最近学习">
          {student.recentTasks.length ? (
            <div className="data-list">
              {student.recentTasks.map((item) => (
                <article className="data-row" key={item.id}>
                  <span className="data-row-mark">{String(item.order).padStart(2, "0")}</span>
                  <div><b>{item.title}</b><small>{item.status} · 完成 {item.percent}%</small></div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无学习记录" description="孩子进入课程并完成步骤后会显示在这里。" />
          )}
        </DashboardPanel>
        <DashboardPanel description="用清楚的作品语言展示本阶段创作" id="works" title="本阶段创作">
          {student.project ? (
            <div className="metric-notes">
              <p><span>作品</span><b>{student.project.title}</b></p>
              <p><span>正在解决</span><b>{student.project.summary}</b></p>
              <p><span>发布状态</span><b>{student.project.publication.status}</b></p>
              {student.project.publication.url && <p><span>作品地址</span><Link href={student.project.publication.url}>查看最终作品</Link></p>}
            </div>
          ) : (
            <EmptyState title="暂无作品" description="孩子创建课程主项目后会显示在这里。" />
          )}
        </DashboardPanel>
      </div>
      <DashboardPanel description="每条记录都由实际创作、逻辑、测试或表达行为生成，不使用虚构提升百分比" title="能力记录">
        <div className="ability-grid">
          {student.abilities.map((ability) => (
            <article key={ability.label}><span>{ability.label.slice(0, 1)}</span><div><b>{ability.label}</b><p>{ability.evidence}</p></div></article>
          ))}
        </div>
      </DashboardPanel>
      <div className="dashboard-columns">
        <DashboardPanel description="查看作品从草稿到发布的变化" title="版本变化">
          {student.project?.versions.length ? (
            <div className="data-list">
              {student.project.versions.map((version) => (
                <article className="data-row" key={version.id}>
                  <span className="data-row-mark">版</span>
                  <div><b>{version.label}</b><small>{version.description || "保存了阶段成果"}</small></div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无版本" description="孩子在创造台保存 1.0、1.1 或 2.0 后会显示在这里。" />
          )}
        </DashboardPanel>
        <DashboardPanel description="教师保存后立即在当前浏览器可见" id="feedback" title="教师评语">
          {student.feedback.length ? (
            <div className="feedback-list">
              {student.feedback.map((item) => (
                <article key={item.id}><span className="avatar-letter">师</span><div><b>演示教师</b><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small><p>{item.summary}</p></div></article>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无教师评语" description="教师在工作台保存评语后会显示在这里。" />
          )}
        </DashboardPanel>
      </div>
    </>
  );
}

function PartnerDashboard({
  data,
}: {
  data: ReturnType<RoleDashboardService["getPartnerDashboard"]>;
}) {
  return (
    <>
      <DashboardHeader
        description={`只汇总 ${data.campus.name} 的演示班级与学生数据。`}
        eyebrow="合作伙伴运营台 · 演示角色"
        title={data.identity.name}
      />
      <DemoNotice>
        当前只有一个演示校区和一个演示班级；所有数字仍由同一套明细计算。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "班级", value: data.stats.classes, detail: "校区范围", symbol: "班" },
          { label: "学生", value: data.stats.students, detail: "班级关联", symbol: "学" },
          { label: "教师", value: data.stats.teachers, detail: "班级任教关系", symbol: "师" },
          { label: "平均课程进度", value: `${data.stats.averageProgress}%`, detail: "学生实际完成记录", symbol: "进" },
          { label: "课程完成率", value: `${data.stats.completionRate}%`, detail: "已完成课数 / 13", symbol: "✓" },
          { label: "项目创建", value: data.stats.projects, detail: "ProjectRepository 明细", symbol: "作" },
          { label: "项目发布", value: data.stats.published, detail: "演示发布状态", symbol: "发" },
          { label: "需要关注", value: data.stats.needsAttention, detail: "教师标记明细", symbol: "!" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description={`${data.campus.city} · 单浏览器演示数据`} title="演示校区信息">
          <div className="metric-notes">
            <p><span>校区</span><b>{data.campus.name}</b></p>
            <p><span>当前活跃课程</span><b>{data.stats.activeLessonId}</b></p>
            <p><span>班级数量</span><b>{data.classes.length}</b></p>
          </div>
        </DashboardPanel>
        <DashboardPanel description="由身份关系和学习明细生成" title="班级运营">
          <div className="data-list">
            {data.classes.map((item) => (
              <article className="data-row" key={item.id}>
                <span className="data-row-mark">班</span>
                <div><b>{item.name}</b><small>{item.schedule} · {item.room}</small></div>
                <span className="status-chip status-active">演示开课中</span>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </>
  );
}

function HqDashboard({
  data,
}: {
  data: ReturnType<RoleDashboardService["getHqDashboard"]>;
}) {
  return (
    <>
      <DashboardHeader
        action={{ label: "查看课程管理", href: "/hq/courses" }}
        description="查看当前演示平台整体数据、单元完成情况与工具使用。"
        eyebrow="总部控制台 · 演示角色"
        title="平台整体数据"
      />
      <DemoNotice>
        当前平台级汇总只有一套演示身份关系；项目、发布、单元与工具使用均从实际本地明细计算。
      </DemoNotice>
      <StatGrid
        items={[
          { label: "合作伙伴 / 校区", value: `${data.stats.partners} / ${data.stats.campuses}`, detail: "演示组织关系", symbol: "校" },
          { label: "班级 / 学生", value: `${data.stats.classes} / ${data.stats.students}`, detail: "演示班级关系", symbol: "班" },
          { label: "教师", value: data.stats.teachers, detail: "演示教师身份", symbol: "师" },
          { label: "课程 / 课次", value: `${data.stats.courses} / ${data.stats.lessons}`, detail: "课程 JSON", symbol: "课" },
          { label: "互动组件 / 工具", value: `${data.stats.interactionComponents} / ${data.stats.courseTools}`, detail: "真实组件与工具注册表", symbol: "具" },
          { label: "项目 / 发布", value: `${data.stats.projects} / ${data.stats.published}`, detail: "本地项目明细", symbol: "作" },
        ]}
      />
      <div className="dashboard-columns">
        <DashboardPanel description="由 13 课实际步骤完成情况计算" title="各单元完成情况">
          <div className="unit-progress-list">
            {data.unitCompletion.map((unit) => (
              <div key={unit.id}><ProgressBar label={unit.title} value={unit.percent} /></div>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel description="按项目字段、测试和决定记录计算" title="互动工具使用情况">
          <div className="tool-usage-list">
            {data.toolUsage.map((tool) => (
              <p key={tool.id}><span>{tool.lessonId} · {tool.name}</span><b>{tool.count} 条使用证据</b></p>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </>
  );
}
