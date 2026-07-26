"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DashboardHeader,
  DashboardPanel,
  DemoNotice,
} from "@/components/platform/DashboardUI";
import {
  demoClassSession,
  type DemoEvidenceRecord,
} from "@/data/mock/product-shell-data";
import { course, lessons } from "@/lib/lesson-loader";
import {
  getBrowserPlatformRepository,
  PLATFORM_UPDATED_EVENT,
} from "@/lib/platform/platform-repository";
import {
  getBrowserRoleDashboardService,
  type RoleDashboardService,
} from "@/lib/platform/role-dashboard-service";
import {
  learningTrail,
  mergeLiveStudent,
  projectEvidence,
} from "@/lib/platform/teacher-workflow";
import { PROGRESS_UPDATED_EVENT } from "@/lib/progress-storage";
import { PROJECT_UPDATED_EVENT } from "@/lib/projects/project-repository";
import { courseToolRegistry } from "@/lib/tools/course-tool-registry";

type TeacherDashboard = ReturnType<RoleDashboardService["getTeacherDashboard"]>;

function readTeacherDashboard() {
  return getBrowserRoleDashboardService(
    course,
    lessons,
    courseToolRegistry,
  )?.getTeacherDashboard() ?? null;
}

function useTeacherData() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  useEffect(() => {
    const refresh = () => setData(readTeacherDashboard());
    const frame = requestAnimationFrame(refresh);
    window.addEventListener(PROJECT_UPDATED_EVENT, refresh);
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh);
    window.addEventListener(PLATFORM_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(PROJECT_UPDATED_EVENT, refresh);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh);
      window.removeEventListener(PLATFORM_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const students = useMemo(
    () =>
      mergeLiveStudent(
        data
          ? {
              completedLessons: data.student.completedLessons,
              currentLessonId: data.student.currentLessonId,
              progressPercent: data.student.progressPercent,
            }
          : null,
        data?.project ?? null,
      ),
    [data],
  );
  const evidence = useMemo(
    () => projectEvidence(data?.project ?? null),
    [data],
  );
  return { data, students, evidence };
}

function TeacherPageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <>
      <DashboardHeader
        action={action}
        description={description}
        eyebrow={`${eyebrow} · 演示数据`}
        title={title}
      />
      <DemoNotice>
        学习进度来自当前浏览器，项目证据来自唯一 ProjectRepository；教师点评写入独立平台数据，不修改学生项目。
      </DemoNotice>
    </>
  );
}

export function TeacherOverview() {
  const { data, students } = useTeacherData();
  if (!data) return <div className="dashboard-loading">正在读取今日教学数据…</div>;
  const attention = students.filter((student) => student.attentionReason);
  return (
    <>
      <TeacherPageIntro
        description="优先看见需要回应的学生，再进入项目证据完成点评。"
        eyebrow="教师工作台 · 今日教学"
        title={`${data.identity.name}，学生此刻正在创造什么？`}
      />
      <section className="today-teaching">
        <div className="class-session-card">
          <span>今日教学</span>
          <h2>{demoClassSession.className}</h2>
          <p>{demoClassSession.lessonId} · {demoClassSession.lessonTitle}</p>
          <small>{demoClassSession.schedule}</small>
          <button className="button button-secondary" type="button">当前班级 ▾</button>
        </div>
        <div className="today-stat-grid">
          <article><strong>{demoClassSession.enrolled}</strong><span>在册学生</span></article>
          <article><strong>{demoClassSession.onlineCreating}</strong><span>在线创作</span></article>
          <Link href="/teacher/reviews"><strong>{students.filter((item) => item.todoStatus === "待点评").length}</strong><span>待点评</span></Link>
          <Link href="/teacher/students?attention=1"><strong>{attention.length}</strong><span>需要关注</span></Link>
        </div>
      </section>

      <section className="teacher-section-heading">
        <div><span className="attention-dot" /><div><h2>需要教师回应</h2><p>按停留、失败、求助与点评状态聚合</p></div></div>
        <Link href="/teacher/students?attention=1">查看全部需要关注 →</Link>
      </section>
      <div className="attention-card-grid">
        {attention.map((student) => (
          <Link className="attention-card" href={`/teacher/students/${student.id}`} key={student.id}>
            <span className="student-avatar">{student.avatar}</span>
            <div className="attention-card-main">
              <div><h3>{student.name}</h3><span>{student.attentionReason}</span></div>
              <p>{student.latestDecision}</p>
              <small>{student.currentLessonId} · 在「{student.currentStep}」环节 · {student.attentionMinutes} 分钟</small>
            </div>
            <i>›</i>
          </Link>
        ))}
      </div>

      <section className="teacher-section-heading">
        <div><div><h2>学生此刻在创造什么</h2><p>当前步骤、最近决定与项目状态</p></div></div>
        <Link href="/teacher/students">进入学生进度 →</Link>
      </section>
      <div className="live-student-grid">
        {students.map((student) => (
          <Link className="live-student-card" href={`/teacher/students/${student.id}`} key={student.id}>
            <header><span className="student-avatar">{student.avatar}</span><div><h3>{student.name}</h3><small>{student.currentLessonId} · {student.projectName}</small></div><span className={`status-chip ${student.testStatus === "全部通过" ? "status-active" : ""}`}>{student.todoStatus}</span></header>
            <div className="step-rhythm" aria-label={`当前在${student.currentStep}环节`}>
              {["看", "讲", "想", "做", "测", "说"].map((step) => <i className={step === student.currentStep ? "is-current" : ""} key={step}>{step}</i>)}
            </div>
            <p><small>最近决定</small>{student.latestDecision}</p>
            <p><small>最近修改</small>{student.latestChange}</p>
            <footer><span>{student.projectVersion}</span><span>{student.testStatus}</span><span>{student.lastSaved}</span></footer>
          </Link>
        ))}
      </div>
    </>
  );
}

export function TeacherStudents() {
  const { students } = useTeacherData();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const filtered = students.filter(
    (student) =>
      (!query || `${student.name}${student.projectName}`.includes(query)) &&
      (!attentionOnly || Boolean(student.attentionReason)) &&
      (!reviewOnly || student.todoStatus === "待点评"),
  );
  return (
    <>
      <TeacherPageIntro
        description="从班级学生进入学习轨迹、项目证据、测试与教师评语。"
        eyebrow="教师 · 学生进度"
        title="学生学习与创作进度"
      />
      <section className="teacher-filter-bar">
        <label className="teacher-search"><span>⌕</span><input aria-label="搜索学生" onChange={(event) => setQuery(event.target.value)} placeholder="搜索学生或项目" value={query} /></label>
        <select aria-label="班级筛选" defaultValue="class-demo"><option value="class-demo">创意编程演示班</option></select>
        <select aria-label="课程筛选" defaultValue="all"><option value="all">全部课程</option><option value="lesson-06">第 06 课</option></select>
        <select aria-label="项目状态筛选" defaultValue="all"><option value="all">全部项目状态</option><option>测试通过</option><option>待重测</option></select>
        <button aria-pressed={attentionOnly} onClick={() => setAttentionOnly((value) => !value)} type="button">需要关注</button>
        <button aria-pressed={reviewOnly} onClick={() => setReviewOnly((value) => !value)} type="button">待点评</button>
        <div className="view-toggle"><button aria-pressed={view === "cards"} onClick={() => setView("cards")} type="button">卡片</button><button aria-pressed={view === "list"} onClick={() => setView("list")} type="button">列表</button></div>
      </section>
      <div className={view === "cards" ? "student-directory-grid" : "student-directory-list"}>
        {filtered.map((student) => (
          <Link className="student-directory-card" href={`/teacher/students/${student.id}`} key={student.id}>
            <header><span className="student-avatar">{student.avatar}</span><div><h3>{student.name}</h3><small>{student.className}</small></div><span className="status-chip">{student.todoStatus}</span></header>
            <div className="student-directory-progress"><span style={{ width: `${Math.round(student.completedLessons / 13 * 100)}%` }} /></div>
            <div className="student-directory-facts">
              <p><span>当前课次</span><b>{student.currentLessonId} · {student.currentStep}</b></p>
              <p><span>已完成</span><b>{student.completedLessons} / 13</b></p>
              <p><span>当前项目</span><b>{student.projectName}</b></p>
              <p><span>项目版本</span><b>{student.projectVersion}</b></p>
              <p><span>最近活动</span><b>{student.lastActivity}</b></p>
              <p><span>最后保存</span><b>{student.lastSaved}</b></p>
            </div>
            <footer>查看学生详情 <span>→</span></footer>
          </Link>
        ))}
      </div>
    </>
  );
}

export function TeacherStudentDetail({ studentId }: { studentId: string }) {
  const { students, evidence } = useTeacherData();
  const student = students.find((item) => item.id === studentId);
  if (!student) {
    return <DashboardPanel title="未找到学生"><p>当前演示班级中没有这个学生。</p><Link className="button button-secondary" href="/teacher/students">返回学生进度</Link></DashboardPanel>;
  }
  const trail = learningTrail(student, lessons);
  const studentEvidence = evidence.filter((item) => item.studentId === student.id);
  return (
    <>
      <nav aria-label="面包屑" className="dashboard-breadcrumb"><Link href="/teacher">教学总览</Link><span>›</span><Link href="/teacher/students">学生进度</Link><span>›</span><b>{student.name}</b></nav>
      <section className="student-detail-hero">
        <span className="student-avatar student-avatar-large">{student.avatar}</span>
        <div><span className="dashboard-eyebrow">{student.className}</span><h1>{student.name}的学习与项目档案</h1><p>{student.lastActivity} · 最后保存 {student.lastSaved}</p></div>
        <div className="student-detail-actions"><span className="status-chip">{student.attentionReason ?? "状态正常"}</span><Link className="button button-primary" href={`/teacher/reviews?student=${student.id}`}>快速点评</Link></div>
      </section>
      <div className="student-detail-summary">
        <article><small>已完成课程</small><b>{student.completedLessons} / 13</b></article>
        <article><small>当前课次</small><b>{student.currentLessonId} · {student.currentStep}</b></article>
        <article><small>当前项目</small><b>{student.projectName}</b></article>
        <article><small>项目版本</small><b>{student.projectVersion}</b></article>
      </div>
      <nav className="student-detail-tabs" aria-label="学生详情分区">
        {["学习轨迹", "项目证据", "版本记录", "测试与Bug", "同伴反馈", "教师评语"].map((label, index) => <a href={`#student-section-${index}`} key={label}>{label}</a>)}
      </nav>
      <DashboardPanel description="第 1—13 课状态、当前步骤、关键决定和修改记录" id="student-section-0" title="学习轨迹">
        <div className="learning-trail">
          {trail.map((item) => (
            <article key={item.id}>
              <span className={item.status === "已完成" ? "is-done" : item.status === "进行中" ? "is-current" : ""}>{String(item.order).padStart(2, "0")}</span>
              <div><h3>{item.title}</h3><small>{item.status} · 当前步骤 {item.step}</small><p>{item.decision}</p><em>{item.change} · {item.activity}</em></div>
              {studentEvidence.some((evidenceItem) => evidenceItem.lessonId === item.id) ? <Link href={`/teacher/evidence?student=${student.id}&lesson=${item.id}`}>查看证据 →</Link> : <span className="muted-link">暂无证据</span>}
            </article>
          ))}
        </div>
      </DashboardPanel>
      <DashboardPanel description={`${studentEvidence.length} 条项目证据`} id="student-section-1" title="项目证据">
        <div className="evidence-preview-grid">
          {studentEvidence.slice(0, 4).map((item) => <Link href={`/teacher/evidence?evidence=${item.id}`} key={item.id}><span>{item.type}</span><h3>{item.name}</h3><p>{item.preview}</p><small>{item.lessonId} · {item.reviewStatus}</small></Link>)}
        </div>
      </DashboardPanel>
      <div className="dashboard-columns">
        <DashboardPanel description="阶段版本与最近修改" id="student-section-2" title="版本记录"><div className="metric-notes"><p><span>当前版本</span><b>{student.projectVersion}</b></p><p><span>最近修改</span><b>{student.latestChange}</b></p></div></DashboardPanel>
        <DashboardPanel description="项目测试与问题状态" id="student-section-3" title="测试与 Bug"><div className="metric-notes"><p><span>当前测试</span><b>{student.testStatus}</b></p><p><span>关注原因</span><b>{student.attentionReason ?? "无"}</b></p></div></DashboardPanel>
      </div>
      <div className="dashboard-columns">
        <DashboardPanel description="来自项目同伴试玩记录" id="student-section-4" title="同伴反馈"><p>{student.latestDecision}</p></DashboardPanel>
        <DashboardPanel description="保存后学生端与家长端可见" id="student-section-5" title="教师评语"><Link className="button button-primary" href={`/teacher/reviews?student=${student.id}`}>填写教师评语</Link></DashboardPanel>
      </div>
    </>
  );
}

export function TeacherEvidence() {
  const { students, evidence } = useTeacherData();
  const [selected, setSelected] = useState<DemoEvidenceRecord | null>(null);
  const [studentId, setStudentId] = useState("all");
  const [type, setType] = useState("all");
  const [review, setReview] = useState("all");
  const filtered = evidence.filter(
    (item) =>
      (studentId === "all" || item.studentId === studentId) &&
      (type === "all" || item.type === type) &&
      (review === "all" || item.reviewStatus === review),
  );
  return (
    <>
      <TeacherPageIntro description="按学生、课次、来源和点评状态查看 ProjectDocument 证据投影。" eyebrow="教师 · 项目证据" title="项目证据中心" />
      <section className="teacher-filter-bar">
        <select aria-label="学生筛选" onChange={(event) => setStudentId(event.target.value)} value={studentId}><option value="all">全部学生</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select>
        <select aria-label="班级筛选" defaultValue="class-demo"><option value="class-demo">创意编程演示班</option></select>
        <select aria-label="课次筛选" defaultValue="all"><option value="all">全部课次</option>{lessons.map((lesson) => <option key={lesson.id}>{lesson.id}</option>)}</select>
        <select aria-label="证据类型筛选" onChange={(event) => setType(event.target.value)} value={type}><option value="all">全部证据类型</option>{[...new Set(evidence.map((item) => item.type))].map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="来源筛选" defaultValue="all"><option value="all">全部来源</option><option>AI生成</option><option>学生修改</option><option>最终采用</option></select>
        <select aria-label="点评状态筛选" onChange={(event) => setReview(event.target.value)} value={review}><option value="all">全部点评状态</option><option>待点评</option><option>需要复查</option><option>已完成</option></select>
      </section>
      <div className="evidence-card-grid">
        {filtered.map((item) => {
          const student = students.find((studentItem) => studentItem.id === item.studentId);
          return (
            <button className="evidence-card" key={item.id} onClick={() => setSelected(item)} type="button">
              <header><span>{item.type}</span><i>{item.reviewStatus}</i></header>
              <h3>{item.name}</h3>
              <p>{item.preview}</p>
              <div><span className="student-avatar">{student?.avatar ?? "学"}</span><span><b>{student?.name ?? "演示学生"}</b><small>{item.lessonId} · {item.createdAt}</small></span></div>
              <footer><span>{item.source}</span><span>{item.version}</span><b>查看详情 →</b></footer>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="evidence-drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside aria-labelledby="evidence-detail-title" aria-modal="true" className="evidence-drawer" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <header><div><span className="status-chip">{selected.type}</span><h2 id="evidence-detail-title">{selected.name}</h2><p>{selected.lessonId} · {selected.createdAt} · {selected.version}</p></div><button aria-label="关闭证据详情" onClick={() => setSelected(null)} type="button">×</button></header>
            <section><h3>完整内容</h3><pre>{selected.fullContent}</pre></section>
            <section><h3>来源与修改</h3><div className="metric-notes"><p><span>内容来源</span><b>{selected.source}</b></p><p><span>修改原因</span><b>{selected.modificationReason || "项目记录未填写修改原因"}</b></p><p><span>测试状态</span><b>{selected.testStatus}</b></p><p><span>关联版本</span><b>{selected.version}</b></p></div></section>
            <section className="evidence-media-placeholder"><span>▧</span><div><b>关联画板或截图</b><p>当前证据没有可公开的截图，保留 ProjectArtifact 引用位置。</p></div></section>
            <footer><button className="button button-secondary" onClick={() => setSelected(null)} type="button">返回证据列表</button><Link className="button button-primary" href={`/teacher/reviews?student=${selected.studentId}&evidence=${selected.id}`}>进入教师点评</Link></footer>
          </aside>
        </div>
      )}
    </>
  );
}

export function TeacherReviews() {
  const { students, evidence } = useTeacherData();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(evidence.find((item) => item.reviewStatus !== "已完成")?.id ?? evidence[0]?.id ?? "");
  const selected = evidence.find((item) => item.id === selectedEvidenceId);
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [mark, setMark] = useState<"doing_well" | "needs_attention">("doing_well");
  const [saved, setSaved] = useState("");
  const save = () => {
    if (!selected || summary.trim().length < 2) return;
    getBrowserPlatformRepository()?.saveTeacherFeedback({
      teacherId: "teacher-lin",
      studentId: selected.studentId,
      summary,
      strengths,
      suggestion,
      lessonId: selected.lessonId,
      evidenceId: selected.id,
      mark,
      status: "completed",
    });
    getBrowserPlatformRepository()?.setAttention(selected.studentId, mark);
    setSaved("点评已写入统一演示数据层；关联学生端与家长端可以读取简短评语。");
  };
  const groups = [
    ["待点评", evidence.filter((item) => item.reviewStatus === "待点评")],
    ["学生求助", evidence.filter((item) => students.find((student) => student.id === item.studentId)?.attentionReason === "学生主动求助")],
    ["需要复查", evidence.filter((item) => item.reviewStatus === "需要复查")],
    ["已完成点评", evidence.filter((item) => item.reviewStatus === "已完成")],
  ] as const;
  return (
    <>
      <TeacherPageIntro description="处理待点评、学生求助、需要复查和已完成记录。" eyebrow="教师 · 点评待办" title="点评工作台" />
      <div className="review-workspace">
        <section className="review-queue">
          {groups.map(([label, items]) => (
            <div key={label}><header><h3>{label}</h3><span>{items.length}</span></header>{items.map((item) => {
              const student = students.find((studentItem) => studentItem.id === item.studentId);
              return <button aria-pressed={selectedEvidenceId === item.id} key={item.id} onClick={() => { setSelectedEvidenceId(item.id); setSaved(""); }} type="button"><span className="student-avatar">{student?.avatar ?? "学"}</span><div><b>{student?.name} · {item.name}</b><small>{item.lessonId} · {item.createdAt}</small><p>{item.preview}</p></div></button>;
            })}</div>
          ))}
        </section>
        <section className="review-editor">
          {selected ? (
            <>
              <header><span className="status-chip">{selected.reviewStatus}</span><h2>{selected.name}</h2><p>{students.find((student) => student.id === selected.studentId)?.name} · {selected.lessonId} · {selected.version}</p></header>
              <article className="review-evidence-preview"><small>提交内容</small><p>{selected.fullContent}</p><span>{selected.testStatus}</span></article>
              <label>简短评语<textarea maxLength={300} onChange={(event) => setSummary(event.target.value)} placeholder="用一句清楚的话概括这次学习表现" rows={3} value={summary} /></label>
              <label>做得好的地方<textarea maxLength={300} onChange={(event) => setStrengths(event.target.value)} placeholder="指出具体决定、修改或测试证据" rows={3} value={strengths} /></label>
              <label>建议修改的地方<textarea maxLength={300} onChange={(event) => setSuggestion(event.target.value)} placeholder="给出下一步可以执行的建议" rows={3} value={suggestion} /></label>
              <fieldset><legend>完成标记</legend><button aria-pressed={mark === "doing_well"} onClick={() => setMark("doing_well")} type="button">完成良好</button><button aria-pressed={mark === "needs_attention"} onClick={() => setMark("needs_attention")} type="button">需要关注</button></fieldset>
              <div className="review-actions"><Link className="button button-secondary" href={`/teacher/evidence?evidence=${selected.id}`}>返回证据</Link><button className="button button-primary" disabled={summary.trim().length < 2} onClick={save} type="button">保存演示点评</button></div>
              {saved && <p className="form-success" role="status">{saved}</p>}
            </>
          ) : <p>选择一条点评待办。</p>}
        </section>
      </div>
    </>
  );
}

export function TeacherCourses() {
  return (
    <>
      <TeacherPageIntro description="只读查看 5 个单元、13 节课与教学目标。" eyebrow="教师 · 我的课程" title="课程地图与预览" />
      <div className="teacher-course-grid">
        {lessons.map((lesson) => <article key={lesson.id}><span>{String(lesson.order).padStart(2, "0")}</span><h3>{lesson.title}</h3><p>{lesson.coreGoal}</p><small>{lesson.steps.map((step) => step.phase).join(" → ")}</small><Link href={`/learn/${course.id}/${lesson.id}?mode=preview`}>只读预览课程 →</Link></article>)}
      </div>
    </>
  );
}

export function TeacherStaticSection({ section }: { section: "prep" | "reports" }) {
  const prep = section === "prep";
  return (
    <>
      <TeacherPageIntro description={prep ? "查看今日课次目标、示范材料和只读课程入口。" : "查看班级与学生的阶段成长摘要。"} eyebrow={prep ? "教师 · 备课与示范" : "教师 · 成长报告"} title={prep ? "备课与示范中心" : "成长报告"} />
      <div className="static-section-grid">
        {(prep ? [
          ["今日课次", "第 06 课 · 点击之后会发生什么", "查看触发—动作—反馈的教学目标与常见问题。"],
          ["课堂示范", "连续点击与重置", "使用受控示例展示失败—修改—重测。"],
          ["只读预览", "教师预览不写入进度", "进入与学生相同的课程页面，但保持只读边界。"],
        ] : [
          ["班级成长", "从结构到互动", "4 名学生正在持续修改各自的同一个主项目。"],
          ["阶段亮点", "开始使用测试证据", "学生能够记录失败、修改和重新验证。"],
          ["待关注方向", "解释修改原因", "下一阶段继续强化决定与证据之间的关系。"],
        ]).map(([kicker, title, description]) => <article key={title}><span>{kicker}</span><h2>{title}</h2><p>{description}</p>{prep && title === "只读预览" ? <Link href={`/learn/${course.id}/lesson-06?mode=preview`}>打开课程预览 →</Link> : <span className="status-chip">静态演示</span>}</article>)}
      </div>
    </>
  );
}
