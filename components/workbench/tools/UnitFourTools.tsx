"use client";

import { useMemo, useState } from "react";
import { ControlledProjectPreview } from "@/components/workbench/ControlledProjectPreview";
import {
  DemoDebugAIService,
  LiveDebugAIService,
} from "@/lib/ai/debug-ai-service";
import {
  createProjectSnapshot,
  type ProjectDocument,
} from "@/lib/projects/project-document";
import {
  applyToolChanges,
  type CourseToolDefinition,
} from "@/lib/tools/course-tool-registry";
import {
  clusterPeerReviews,
  compareVersions,
  composeInitialFlow,
  createExperienceChecks,
  generateReproductionSteps,
  moveFlowNode,
  validateAppFlow,
} from "@/lib/unit-four/app-workflow";

type ToolProps = {
  definition: CourseToolDefinition;
  project: ProjectDocument;
  onChange: (next: ProjectDocument) => void;
};

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}`;

function replaceById<T extends { id: string }>(items: T[], next: T) {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next];
}

function testRecord(
  project: ProjectDocument,
  id: string,
  name: string,
  passed: boolean,
  toolId: string,
  message: string,
): ProjectDocument["tests"][number] {
  return {
    id,
    name,
    status: passed ? "pass" : "fail",
    projectRevision: project.revision,
    toolId,
    message,
    attempts: (project.tests.find((item) => item.id === id)?.attempts ?? 0) + 1,
    updatedAt: now(),
  };
}

function screenshotArtifact(
  project: ProjectDocument,
  id: string,
  name: string,
): ProjectDocument["artifacts"][number] {
  const content = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="100%" height="100%" fill="${project.styleTokens.background}"/><text x="48" y="90" font-size="34" fill="${project.styleTokens.text}">${project.title}</text><text x="48" y="140" font-size="18" fill="${project.styleTokens.primary}">受控应用预览截图 · ${new Date().toLocaleString("zh-CN")}</text></svg>`,
  );
  return {
    id,
    type: "screenshot",
    name,
    content: `data:image/svg+xml,${content}`,
    createdAt: now(),
    updatedAt: now(),
  };
}

function version(
  project: ProjectDocument,
  label: "App 1.0" | "修复版 1.1" | "试玩升级版 2.0",
  description: string,
  coverArtifactId: string | null,
  screenshotArtifactId: string | null,
  changes: string[],
  aiSuggestions: string[],
  studentDecisions: string[],
  peerFeedback: string[],
): ProjectDocument["versions"][number] {
  const passed = project.tests.filter((item) => item.status === "pass").length;
  return {
    id: uid(`version-${label.replace(/\s/g, "-")}`),
    label,
    description,
    revision: project.revision,
    snapshot: createProjectSnapshot(project),
    createdAt: now(),
    coverArtifactId,
    screenshotArtifactId,
    changes,
    testSummary: `${passed}/${project.tests.length} 项测试通过`,
    aiSuggestions,
    studentDecisions,
    peerFeedback,
  };
}

export function AppFlowComposer({ definition, project, onChange }: ToolProps) {
  const [flow, setFlow] = useState(() =>
    project.appFlow.nodes.length > 0 ? project.appFlow : composeInitialFlow(project),
  );
  const [fromPageId, setFromPageId] = useState(flow.startPageId ?? "");
  const [toPageId, setToPageId] = useState(flow.resultPageId ?? "");
  const [connectionKind, setConnectionKind] =
    useState<"next" | "return" | "restart">("next");
  const [role, setRole] = useState(flow.simulationRoles[0] ?? "目标用户");
  const [coverName, setCoverName] = useState(`${project.title} 1.0 封面`);
  const [versionNote, setVersionNote] = useState("完成核心流程，保留必要入口并删除绕路功能。");
  const [kept, setKept] = useState(project.scope.mustHave.join("、"));
  const [removed, setRemoved] = useState(project.scope.outOfScope.join("、"));
  const problems = validateAppFlow(flow);

  const updateNode = (
    pageId: string,
    changes: Partial<ProjectDocument["appFlow"]["nodes"][number]>,
  ) => setFlow((current) => ({
    ...current,
    nodes: current.nodes.map((node) => node.pageId === pageId ? { ...node, ...changes } : node),
  }));

  const addConnection = () => {
    if (!fromPageId || !toPageId || fromPageId === toPageId) return;
    setFlow((current) => ({
      ...current,
      connections: replaceById(current.connections, {
        id: `flow-${fromPageId}-${toPageId}-${connectionKind}`,
        fromPageId,
        toPageId,
        kind: connectionKind,
      }),
    }));
  };

  const saveFlow = () => {
    onChange(applyToolChanges(project, definition, {
      appFlow: flow,
      artifacts: replaceById(project.artifacts, {
        id: "artifact-app-code-map",
        type: "code",
        name: "App 完整代码结构",
        content: [
          "app/",
          ...flow.nodes.filter((item) => item.enabled).sort((a, b) => a.order - b.order)
            .map((item) => `  ${project.pages.find((page) => page.id === item.pageId)?.slug ?? item.pageId}/page.tsx`),
          "components/",
          ...project.components.map((item) => `  ${item.name}.tsx`),
          "lib/flow.ts",
        ].join("\n"),
        createdAt: now(),
        updatedAt: now(),
      }),
      decisions: replaceById(project.decisions, {
        id: "decision-app-flow",
        lessonId: "lesson-10",
        toolId: definition.id,
        title: "应用流程与删减决定",
        reason: `保留：${kept || "核心功能"}；删除：${removed || "暂无"}`,
        suggestedBy: "student",
        createdAt: now(),
      }),
    }));
  };

  const runVoyage = () => {
    const passed = problems.length === 0;
    const nextFlow = {
      ...flow,
      completedVoyages: flow.completedVoyages + 1,
    };
    setFlow(nextFlow);
    onChange(applyToolChanges(project, definition, {
      appFlow: nextFlow,
      testScenarios: replaceById(project.testScenarios, {
        id: "scenario-full-voyage",
        name: "App 1.0 全流程试航",
        role,
        task: "从核心入口完成一次任务并重新开始",
        pageIds: nextFlow.nodes.filter((item) => item.enabled).sort((a, b) => a.order - b.order).map((item) => item.pageId),
        steps: nextFlow.connections.map((edge) => `${edge.fromPageId} → ${edge.toPageId}`),
        status: passed ? "pass" : "fail",
        runCount: (project.testScenarios.find((item) => item.id === "scenario-full-voyage")?.runCount ?? 0) + 1,
        readOnly: true,
      }),
      tests: replaceById(project.tests, testRecord(project, "app-full-voyage", "用户角色全流程试航", passed, definition.id, passed ? `${role} 完成全流程` : problems.join("；"))),
    }));
  };

  const repairInterruption = () => {
    const start = flow.startPageId;
    const result = flow.resultPageId;
    if (!start || !result) return;
    const fixed = {
      ...flow,
      connections: replaceById(flow.connections, {
        id: `flow-${result}-${start}-restart`,
        fromPageId: result,
        toPageId: start,
        kind: "restart" as const,
      }),
    };
    setFlow(fixed);
    onChange(applyToolChanges(project, definition, {
      appFlow: fixed,
      tests: replaceById(project.tests, testRecord(project, "app-interruption-fix", "修复至少一个中断点", true, definition.id, "结果页已连接重新开始")),
      decisions: replaceById(project.decisions, {
        id: "decision-interruption-fix",
        lessonId: "lesson-10",
        toolId: definition.id,
        title: "修复流程中断",
        reason: "学生选择为结果页补上重新开始，而不是让 AI 自动改整个项目",
        suggestedBy: "student",
        createdAt: now(),
      }),
    }));
  };

  const generateChecks = () => {
    const next = { ...flow, experienceChecks: createExperienceChecks({ ...project, appFlow: flow }) };
    setFlow(next);
    onChange(applyToolChanges(project, definition, { appFlow: next }));
  };

  const respondToCheck = (
    id: string,
    response: "agree" | "disagree" | "modify" | "defer",
  ) => setFlow((current) => ({
    ...current,
    experienceChecks: current.experienceChecks.map((item) =>
      item.id === id ? { ...item, studentResponse: response } : item),
  }));

  const generateV1 = () => {
    const screenshot = screenshotArtifact(project, "artifact-app-1-screenshot", "App 1.0 版本截图");
    const cover = { ...screenshot, id: "artifact-app-1-cover", type: "cover" as const, name: coverName };
    const allDecided = flow.experienceChecks.length === 6 &&
      flow.experienceChecks.every((item) => item.studentResponse);
    const ready = validateAppFlow(flow).length === 0 &&
      flow.completedVoyages > 0 &&
      project.tests.some((item) => item.id === "app-interruption-fix" && item.status === "pass") &&
      allDecided;
    const check = testRecord(project, "app-version-1", "生成 App 1.0", ready, definition.id, ready ? "流程、试航、修复和学生决策完整" : "请完成流程、试航、修复和六项体验检查决定");
    if (!ready) {
      onChange(applyToolChanges(project, definition, { appFlow: flow, tests: replaceById(project.tests, check) }));
      return;
    }
    const nextProject = { ...project, appFlow: flow, tests: replaceById(project.tests, check) };
    onChange(applyToolChanges(project, definition, {
      appFlow: flow,
      artifacts: [...project.artifacts.filter((item) => ![screenshot.id, cover.id].includes(item.id)), screenshot, cover],
      tests: nextProject.tests,
      versions: [...project.versions.filter((item) => item.label !== "App 1.0"), version(
        nextProject,
        "App 1.0",
        versionNote,
        cover.id,
        screenshot.id,
        [`保留：${kept || "核心功能"}`, `删除：${removed || "无用步骤"}`, "修复结果页重新开始"],
        flow.experienceChecks.map((item) => `${item.question}：${item.suggestion}`),
        flow.experienceChecks.map((item) => `${item.question}：${item.studentResponse}${item.studentNote ? `（${item.studentNote}）` : ""}`),
        [],
      )],
    }));
  };

  return (
    <div className="unit-four-studio flow-composer">
      <section className="studio-card">
        <header><div><small>APP FLOW COMPOSER</small><h3>把第2—9课成果组织成完整 App</h3></div><span>{flow.nodes.filter((item) => item.enabled).length} 个页面启用</span></header>
        <div className="flow-board">
          {[...flow.nodes].sort((a, b) => a.order - b.order).map((node, index) => (
            <article className={node.enabled ? "" : "disabled"} key={node.pageId}>
              <b>{index + 1}. {node.label}</b>
              <small>{project.components.filter((item) => item.pageId === node.pageId).length} 组件 · {project.structure.filter((item) => item.pageId === node.pageId).length} 结构节点</small>
              <div>
                <button onClick={() => setFlow((current) => moveFlowNode(current, node.pageId, -1))} type="button">上移</button>
                <button onClick={() => setFlow((current) => moveFlowNode(current, node.pageId, 1))} type="button">下移</button>
                <button onClick={() => updateNode(node.pageId, { enabled: !node.enabled })} type="button">{node.enabled ? "删除功能" : "放回流程"}</button>
              </div>
              <label><input checked={flow.startPageId === node.pageId} name="start" onChange={() => setFlow((current) => ({ ...current, startPageId: node.pageId }))} type="radio" /> 起点</label>
              <label><input checked={flow.coreEntryPageId === node.pageId} name="entry" onChange={() => setFlow((current) => ({ ...current, coreEntryPageId: node.pageId }))} type="radio" /> 核心入口</label>
              <label><input checked={flow.resultPageId === node.pageId} name="result" onChange={() => setFlow((current) => ({ ...current, resultPageId: node.pageId }))} type="radio" /> 结果页</label>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-card connection-panel">
        <h3>点击后连接 · 平板也可排序</h3>
        <select aria-label="连接起点" onChange={(event) => setFromPageId(event.target.value)} value={fromPageId}>{flow.nodes.filter((item) => item.enabled).map((item) => <option key={item.pageId} value={item.pageId}>{item.label}</option>)}</select>
        <span>→</span>
        <select aria-label="连接终点" onChange={(event) => setToPageId(event.target.value)} value={toPageId}>{flow.nodes.filter((item) => item.enabled).map((item) => <option key={item.pageId} value={item.pageId}>{item.label}</option>)}</select>
        <select aria-label="连接类型" onChange={(event) => setConnectionKind(event.target.value as typeof connectionKind)} value={connectionKind}><option value="next">下一页</option><option value="return">返回</option><option value="restart">重新开始</option></select>
        <button onClick={addConnection} type="button">添加连接</button>
        <div className="connection-list">{flow.connections.map((edge) => <button key={edge.id} onClick={() => setFlow((current) => ({ ...current, connections: current.connections.filter((item) => item.id !== edge.id) }))} type="button">{edge.fromPageId} → {edge.toPageId} · {edge.kind} ×</button>)}</div>
      </section>

      <section className="studio-card simulator-panel">
        <h3>角色试航与应用预览</h3>
        <div className="role-switch">{flow.simulationRoles.map((item) => <button aria-pressed={role === item} key={item} onClick={() => setRole(item)} type="button">{item}</button>)}</div>
        <ControlledProjectPreview project={project} />
        <button onClick={runVoyage} type="button">以“{role}”完成一次全流程试航</button>
        <button onClick={repairInterruption} type="button">局部修复：结果页添加重新开始</button>
        <p className={problems.length ? "studio-warning" : "studio-pass"}>{problems.length ? problems.join("；") : `流程可达，已试航 ${flow.completedVoyages} 次`}</p>
      </section>

      <section className="studio-card ai-review-panel">
        <header><div><small>LOCAL EXPERIENCE CHECK</small><h3>AI 体验检查草稿</h3></div><button onClick={generateChecks} type="button">读取项目并生成草稿</button></header>
        <p className="local-ai-boundary">Demo 本地规则只提出检查草稿，不自动修改整个项目。学生必须逐项决定。</p>
        {flow.experienceChecks.map((item) => (
          <article key={item.id}>
            <div><b>{item.question}</b><span>{item.finding}</span><small>{item.suggestion}</small></div>
            <select onChange={(event) => respondToCheck(item.id, event.target.value as "agree" | "disagree" | "modify" | "defer")} value={item.studentResponse ?? ""}>
              <option value="">学生决定…</option><option value="agree">同意</option><option value="disagree">不同意</option><option value="modify">修改建议</option><option value="defer">暂不处理</option>
            </select>
            <input onChange={(event) => setFlow((current) => ({ ...current, experienceChecks: current.experienceChecks.map((check) => check.id === item.id ? { ...check, studentNote: event.target.value } : check) }))} placeholder="写下修改或理由" value={item.studentNote} />
          </article>
        ))}
      </section>

      <section className="studio-card version-maker">
        <h3>生成 App 1.0</h3>
        <label>版本封面名称<input onChange={(event) => setCoverName(event.target.value)} value={coverName} /></label>
        <label>版本说明<textarea onChange={(event) => setVersionNote(event.target.value)} value={versionNote} /></label>
        <label>保留功能<input onChange={(event) => setKept(event.target.value)} value={kept} /></label>
        <label>删除功能<input onChange={(event) => setRemoved(event.target.value)} value={removed} /></label>
        <div><button onClick={saveFlow} type="button">保存流程与完整代码结构</button><button onClick={generateV1} type="button">生成版本快照 App 1.0</button></div>
      </section>
    </div>
  );
}

export function BugAnnotationStudio({ definition, project, onChange }: ToolProps) {
  const [tool, setTool] = useState<"circle" | "arrow" | "text">("circle");
  const [problemType, setProblemType] = useState<"visual" | "interaction" | "logic" | "content">("interaction");
  const [annotationText, setAnnotationText] = useState("这里操作后没有反馈");
  const [annotations, setAnnotations] = useState(project.bugAnnotations);
  const [before, setBefore] = useState("从首页进入核心功能");
  const [after, setAfter] = useState("点击主操作按钮");
  const [expected, setExpected] = useState("页面显示清楚的结果");
  const [actual, setActual] = useState("页面没有变化");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [aiMode, setAiMode] = useState<"demo" | "live">("demo");
  const [aiMessage, setAiMessage] = useState("");
  const [fixPlan, setFixPlan] = useState("只修改关联组件的反馈状态，并保留现有流程。");
  const [diff, setDiff] = useState("");
  const screenshotId = "artifact-bug-screenshot";
  const page = project.pages[0];
  const latestReport = project.bugReports.at(-1);
  const latestDraft = project.aiDebugDrafts.find((item) => item.bugReportId === latestReport?.id);
  const latestFix = project.studentFixes.at(-1);

  const capture = () => {
    const screenshot = screenshotArtifact(project, screenshotId, "Bug 现场截图");
    onChange(applyToolChanges(project, definition, {
      artifacts: replaceById(project.artifacts, screenshot),
    }));
  };

  const mark = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const annotation = {
      id: uid("annotation"),
      screenshotArtifactId: screenshotId,
      pageId: page?.id ?? "page-home",
      shape: tool,
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
      width: tool === "text" ? 30 : 16,
      height: tool === "arrow" ? 4 : 16,
      text: annotationText,
      problemType,
    };
    setAnnotations((current) => [...current, annotation]);
  };

  const saveReport = () => {
    const reportId = uid("bug");
    const reproSteps = generateReproductionSteps([before], page?.name ?? "首页", [after]);
    const report: ProjectDocument["bugReports"][number] = {
      id: reportId,
      title: annotationText,
      type: problemType,
      severity: "high",
      beforeActions: [before],
      afterActions: [after],
      reproSteps,
      expected,
      actual,
      annotationIds: annotations.map((item) => item.id),
      componentIds: project.components.filter((item) => item.pageId === page?.id).map((item) => item.id),
      codeExcerpt: project.artifacts.find((item) => item.type === "code")?.content ?? "受控组件代码尚未生成",
      testLog: project.tests.slice(-5).map((item) => `${item.name}: ${item.status} — ${item.message}`),
      status: "open",
    };
    onChange(applyToolChanges(project, definition, {
      bugAnnotations: annotations,
      bugReports: [...project.bugReports, report],
      tests: replaceById(project.tests, testRecord(project, "bug-reproduction", "Bug 复现过程", reproSteps.length >= 5, definition.id, reproSteps.join(" → "))),
      artifacts: replaceById(project.artifacts, {
        id: "artifact-bug-report",
        type: "document",
        name: "Bug 标注与复现报告",
        content: JSON.stringify(report, null, 2),
        createdAt: now(),
        updatedAt: now(),
      }),
    }));
  };

  const generateDraft = async () => {
    if (!latestReport) return;
    setAiMessage("正在分析调试材料…");
    try {
      const service = aiMode === "live" ? new LiveDebugAIService() : new DemoDebugAIService();
      const draft = await service.analyze({
        report: latestReport,
        screenshot: project.artifacts.find((item) => item.id === screenshotId)?.content ?? null,
        annotations: annotations.filter((item) => latestReport.annotationIds.includes(item.id)),
        relatedCode: latestReport.codeExcerpt,
        testLogs: latestReport.testLog,
      });
      setAiMessage(draft.disclaimer);
      onChange(applyToolChanges(project, definition, {
        aiDebugDrafts: replaceById(project.aiDebugDrafts, draft),
        tests: replaceById(project.tests, testRecord(project, "ai-debug-draft", "AI 调试草稿", true, definition.id, draft.disclaimer)),
      }));
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "AI 调试服务暂时不可用");
    }
  };

  const applyFix = () => {
    if (!latestDraft || !selectedSuggestion || fixPlan.trim().length < 8) return;
    const suggestion = latestDraft.suggestions.find((item) => item.id === selectedSuggestion);
    if (!suggestion) return;
    const nextDiff = `- feedback: "${actual}"\n+ feedback: "${expected}"\n+ aria-live: "polite"`;
    setDiff(nextDiff);
    const fix: ProjectDocument["studentFixes"][number] = {
      id: uid("fix"),
      draftId: latestDraft.id,
      suggestionId: suggestion.id,
      modifiedPlan: fixPlan,
      patchSummary: suggestion.fix,
      diff: nextDiff,
      beforeTestStatus: "fail",
      afterTestStatus: "pending",
      resolved: false,
    };
    onChange(applyToolChanges(project, definition, {
      studentFixes: [...project.studentFixes, fix],
      bugReports: project.bugReports.map((item) => item.id === latestReport?.id ? { ...item, status: "fixing" } : item),
      decisions: replaceById(project.decisions, {
        id: `decision-${latestDraft.id}`,
        lessonId: "lesson-11",
        toolId: definition.id,
        title: "选择并修改 AI 修复建议",
        reason: fixPlan,
        suggestedBy: "student",
        createdAt: now(),
      }),
    }));
  };

  const retest = () => {
    if (!latestFix || !latestReport) return;
    const fixes = project.studentFixes.map((item) =>
      item.id === latestFix.id ? { ...item, afterTestStatus: "pass" as const, resolved: true } : item,
    );
    onChange(applyToolChanges(project, definition, {
      studentFixes: fixes,
      bugReports: project.bugReports.map((item) => item.id === latestReport.id ? { ...item, status: "resolved" } : item),
      tests: replaceById(project.tests, testRecord(project, "bug-fix-retest", "局部修复后重新测试", true, definition.id, "按原步骤复测，实际结果与预期一致")),
    }));
  };

  const generateV11 = () => {
    const fixed = project.studentFixes.some((item) => item.resolved && item.afterTestStatus === "pass");
    const check = testRecord(project, "app-version-1-1", "生成修复版 1.1", fixed, definition.id, fixed ? "已比较建议、局部修复、查看差异并复测" : "请先完成修复与复测");
    if (!fixed) {
      onChange(applyToolChanges(project, definition, { tests: replaceById(project.tests, check) }));
      return;
    }
    const screenshot = screenshotArtifact(project, "artifact-app-1-1-screenshot", "修复版 1.1 截图");
    const nextProject = { ...project, tests: replaceById(project.tests, check) };
    onChange(applyToolChanges(project, definition, {
      artifacts: replaceById(project.artifacts, screenshot),
      tests: nextProject.tests,
      versions: [...project.versions.filter((item) => item.label !== "修复版 1.1"), version(
        nextProject,
        "修复版 1.1",
        "根据标注、复现、调试草稿与学生修订完成局部修复。",
        null,
        screenshot.id,
        project.studentFixes.map((item) => item.patchSummary),
        latestDraft?.suggestions.map((item) => item.fix) ?? [],
        [fixPlan],
        [],
      )],
    }));
  };

  return (
    <div className="unit-four-studio bug-studio">
      <section className="studio-card annotation-workspace">
        <header><div><small>BUG ANNOTATION STUDIO</small><h3>在自己的 App 预览中直接标记问题</h3></div><button onClick={capture} type="button">截取当前预览</button></header>
        <div className="annotation-toolbar">
          {(["circle", "arrow", "text"] as const).map((item) => <button aria-pressed={tool === item} key={item} onClick={() => setTool(item)} type="button">{item === "circle" ? "圈出问题" : item === "arrow" ? "添加箭头" : "添加文字"}</button>)}
          <select onChange={(event) => setProblemType(event.target.value as typeof problemType)} value={problemType}><option value="visual">视觉</option><option value="interaction">交互</option><option value="logic">逻辑</option><option value="content">内容</option></select>
          <input onChange={(event) => setAnnotationText(event.target.value)} value={annotationText} />
        </div>
        <div className="annotation-canvas" onClick={mark} role="button" tabIndex={0}>
          <ControlledProjectPreview project={project} />
          {annotations.map((item) => <span className={`mark-${item.shape}`} key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%` }} title={item.text}>{item.shape === "text" ? item.text : item.shape === "arrow" ? "➜" : ""}</span>)}
        </div>
      </section>

      <section className="studio-card reproduction-panel">
        <h3>记录现场并自动生成复现步骤</h3>
        <label>发生前<input onChange={(event) => setBefore(event.target.value)} value={before} /></label>
        <label>触发操作<input onChange={(event) => setAfter(event.target.value)} value={after} /></label>
        <label>预期结果<textarea onChange={(event) => setExpected(event.target.value)} value={expected} /></label>
        <label>实际结果<textarea onChange={(event) => setActual(event.target.value)} value={actual} /></label>
        <button disabled={annotations.length === 0} onClick={saveReport} type="button">生成 Bug 报告与复现步骤</button>
        {latestReport && <ol>{latestReport.reproSteps.map((step) => <li key={step}>{step}</li>)}</ol>}
      </section>

      <section className="studio-card browser-log">
        <h3>浏览器测试日志与代码关联</h3>
        <pre>{latestReport?.testLog.join("\n") || project.tests.map((item) => `${item.status} ${item.name}: ${item.message}`).join("\n") || "还没有测试日志"}</pre>
        <details><summary>相关组件与代码</summary><p>{latestReport?.componentIds.join("、") || "保存报告后自动关联"}</p><pre>{latestReport?.codeExcerpt || "等待关联代码"}</pre></details>
      </section>

      <section className="studio-card ai-debug-panel">
        <header><div><small>DEBUG ASSISTANT</small><h3>AI 调试助手草稿</h3></div><div className="studio-actions"><select aria-label="AI调试模式" onChange={(event) => setAiMode(event.target.value as "demo" | "live")} value={aiMode}><option value="demo">Demo 本地规则</option><option value="live">真实 AI</option></select><button disabled={!latestReport} onClick={generateDraft} type="button">分析输入材料</button></div></header>
        <p className="local-ai-boundary">{aiMode === "demo" ? "Demo 模式明确是本地提示：不会声称理解截图，也不会自动修改项目。" : "真实 AI 模式会提交问题截图、标注、复现、预期与实际、相关代码和测试日志；仍只返回候选草稿。"}</p>
        {aiMessage && <p>{aiMessage}</p>}
        {latestDraft?.suggestions.map((item) => (
          <label className="debug-suggestion" key={item.id}>
            <input checked={selectedSuggestion === item.id} name="debug-suggestion" onChange={() => setSelectedSuggestion(item.id)} type="radio" />
            <span><b>可能原因：{item.cause}</b><small>检查：{item.checkLocation}</small><small>方案：{item.fix}</small><small>风险：{item.risk}</small><small>复测：{item.retest}</small></span>
          </label>
        ))}
        <label>学生修改后的修复方案<textarea onChange={(event) => setFixPlan(event.target.value)} value={fixPlan} /></label>
        <button disabled={!selectedSuggestion} onClick={applyFix} type="button">应用局部修复并查看差异</button>
        {diff && <pre className="code-diff">{diff}</pre>}
        <div className="studio-actions"><button disabled={!latestFix} onClick={retest} type="button">按原步骤重新测试</button><button onClick={generateV11} type="button">判断解决并生成 1.1</button></div>
      </section>
    </div>
  );
}

export function PeerReviewStudio({ definition, project, onChange }: ToolProps) {
  const [readOnly, setReadOnly] = useState(true);
  const [reviewer, setReviewer] = useState("同伴试玩者");
  const [task, setTask] = useState("从首页进入核心功能，完成一次操作并重新开始");
  const [pageId, setPageId] = useState(project.appFlow.startPageId ?? project.pages[0]?.id ?? "page-home");
  const [note, setNote] = useState("我在这里停了一下");
  const [emotion, setEmotion] = useState<"happy" | "neutral" | "confused" | "frustrated">("confused");
  const [favorite, setFavorite] = useState("");
  const [stuckAt, setStuckAt] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "blocker">("medium");
  const [problemType, setProblemType] = useState<"visual" | "interaction" | "logic" | "content" | "experience">("experience");
  const [curve, setCurve] = useState([-1, 0, 1]);
  const [studentSummary, setStudentSummary] = useState("");
  const [featureFix, setFeatureFix] = useState("");
  const [experienceFix, setExperienceFix] = useState("");
  const [retested, setRetested] = useState(false);
  const clusters = useMemo(() => clusterPeerReviews(project.peerReviews), [project.peerReviews]);
  const versions = project.versions;
  const comparison = versions.length >= 2 ? compareVersions(versions[0], versions.at(-1)!) : null;

  const submitReview = () => {
    const screenshot = screenshotArtifact(project, uid("peer-screenshot"), "同伴只读试玩截图");
    const annotationId = uid("peer-annotation");
    const reviewId = uid("peer-review");
    const annotation: ProjectDocument["bugAnnotations"][number] = {
      id: annotationId,
      screenshotArtifactId: screenshot.id,
      pageId,
      shape: "circle",
      x: 54,
      y: 42,
      width: 20,
      height: 18,
      text: note,
      problemType: problemType === "experience" ? "interaction" : problemType,
    };
    const review: ProjectDocument["peerReviews"][number] = {
      id: reviewId,
      reviewer,
      taskId: "peer-task-main",
      pageId,
      readOnly: true,
      screenshotArtifactId: screenshot.id,
      annotationIds: [annotationId],
      note,
      emotion,
      favorite,
      stuckAt,
      suggestion,
      severity,
      problemType,
      cluster: `${pageId}:${problemType}:${severity}`,
      aiSummary: "",
      studentSummary: "",
    };
    const experienceCurve: ProjectDocument["experienceCurves"][number] = {
      id: uid("curve"),
      reviewId,
      points: (["start", "action", "result"] as const).map((phase, index) => ({
        phase,
        emotion: curve[index],
        note: phase === "action" ? stuckAt : phase === "result" ? suggestion : favorite,
      })),
    };
    onChange(applyToolChanges(project, definition, {
      artifacts: [...project.artifacts, screenshot],
      bugAnnotations: [...project.bugAnnotations, annotation],
      peerReviews: [...project.peerReviews, review],
      experienceCurves: [...project.experienceCurves, experienceCurve],
      testScenarios: replaceById(project.testScenarios, {
        id: "scenario-peer-readonly",
        name: "同伴只读试玩",
        role: reviewer,
        task,
        pageIds: project.appFlow.nodes.filter((item) => item.enabled).map((item) => item.pageId),
        steps: ["进入只读模式", "完成制作者任务", "截图圈选", "提交情绪曲线与建议"],
        status: "pass",
        runCount: (project.testScenarios.find((item) => item.id === "scenario-peer-readonly")?.runCount ?? 0) + 1,
        readOnly: true,
      }),
      tests: replaceById(project.tests, testRecord(project, "peer-readonly-review", "只读试玩与反馈写入隔离", readOnly, definition.id, readOnly ? "App 正文未修改，反馈写入独立字段" : "请先进入只读试玩模式")),
    }));
  };

  const organize = () => {
    const summary = clusters.map((item) => `${item.pageId} · ${item.severity} · ${item.problemType}（${item.count}条）：${item.summary}`).join("\n");
    setStudentSummary(summary);
    onChange(applyToolChanges(project, definition, {
      peerReviews: project.peerReviews.map((review) => ({
        ...review,
        aiSummary: `本地聚类草稿：${review.cluster}`,
      })),
      tests: replaceById(project.tests, testRecord(project, "peer-feedback-cluster", "反馈整理与本地 AI 草稿", clusters.length > 0, definition.id, clusters.length ? `形成 ${clusters.length} 个反馈簇` : "请先提交试玩反馈")),
    }));
  };

  const saveDecision = () => {
    if (!featureFix.trim() || !experienceFix.trim() || !studentSummary.trim()) return;
    onChange(applyToolChanges(project, definition, {
      peerReviews: project.peerReviews.map((review) => ({ ...review, studentSummary })),
      decisions: [
        ...project.decisions.filter((item) => item.id !== "decision-peer-upgrade"),
        {
          id: "decision-peer-upgrade",
          lessonId: "lesson-12",
          toolId: definition.id,
          title: "选择一个功能问题和一个体验问题",
          reason: `功能：${featureFix}；体验：${experienceFix}`,
          suggestedBy: "student",
          createdAt: now(),
        },
      ],
    }));
  };

  const generateV2 = () => {
    const ready = project.peerReviews.length > 0 &&
      project.experienceCurves.length > 0 &&
      featureFix.trim().length > 0 &&
      experienceFix.trim().length > 0 &&
      retested;
    const check = testRecord(project, "app-version-2", "生成试玩升级版 2.0", ready, definition.id, ready ? "反馈已整理、双问题已修改并使用相同任务复测" : "请完成反馈、双问题选择和相同任务复测");
    if (!ready) {
      onChange(applyToolChanges(project, definition, { tests: replaceById(project.tests, check) }));
      return;
    }
    const screenshot = screenshotArtifact(project, "artifact-app-2-screenshot", "试玩升级版 2.0 截图");
    const nextProject = { ...project, tests: replaceById(project.tests, check) };
    const v2 = version(
      nextProject,
      "试玩升级版 2.0",
      `升级说明：修复功能问题“${featureFix}”，改善体验问题“${experienceFix}”。`,
      null,
      screenshot.id,
      [featureFix, experienceFix],
      project.peerReviews.map((item) => item.aiSummary).filter(Boolean),
      [studentSummary],
      project.peerReviews.map((item) => item.suggestion || item.note),
    );
    onChange(applyToolChanges(project, definition, {
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== screenshot.id),
        screenshot,
        {
          id: "artifact-upgrade-notes",
          type: "document",
          name: "App 2.0 升级说明",
          content: v2.description,
          createdAt: now(),
          updatedAt: now(),
        },
      ],
      tests: nextProject.tests,
      versions: [...project.versions.filter((item) => item.label !== "试玩升级版 2.0"), v2],
    }));
  };

  return (
    <div className="unit-four-studio peer-studio">
      <section className="studio-card readonly-playtest">
        <header><div><small>PEER REVIEW STUDIO</small><h3>同一浏览器演示试玩</h3></div><button aria-pressed={readOnly} onClick={() => setReadOnly((value) => !value)} type="button">{readOnly ? "只读模式已开启" : "进入只读模式"}</button></header>
        <p className="local-ai-boundary">当前无数据库：试玩链接不跨账号，仅在本浏览器中切换身份；App 正文冻结，反馈通过预留的 `peerReviews` 接口单独写入。</p>
        <label>试玩者<input onChange={(event) => setReviewer(event.target.value)} value={reviewer} /></label>
        <label>制作者任务<textarea onChange={(event) => setTask(event.target.value)} value={task} /></label>
        <select onChange={(event) => setPageId(event.target.value)} value={pageId}>{project.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select>
        <ControlledProjectPreview project={project} />
      </section>

      <section className="studio-card peer-annotation">
        <h3>在当前页面截图上圈选并贴便签</h3>
        <div className="peer-screenshot"><span>○</span><b>{note}</b></div>
        <label>便签<input onChange={(event) => setNote(event.target.value)} value={note} /></label>
        <label>最喜欢的部分<input onChange={(event) => setFavorite(event.target.value)} value={favorite} /></label>
        <label>卡住的位置<input onChange={(event) => setStuckAt(event.target.value)} value={stuckAt} /></label>
        <label>具体建议<textarea onChange={(event) => setSuggestion(event.target.value)} value={suggestion} /></label>
        <div className="emotion-picker">{(["happy", "neutral", "confused", "frustrated"] as const).map((item) => <button aria-pressed={emotion === item} key={item} onClick={() => setEmotion(item)} type="button">{item === "happy" ? "😊 喜欢" : item === "neutral" ? "😐 普通" : item === "confused" ? "😕 困惑" : "😣 受挫"}</button>)}</div>
        <div><select onChange={(event) => setProblemType(event.target.value as typeof problemType)} value={problemType}><option value="experience">体验</option><option value="visual">视觉</option><option value="interaction">交互</option><option value="logic">逻辑</option><option value="content">内容</option></select><select onChange={(event) => setSeverity(event.target.value as typeof severity)} value={severity}><option value="low">轻微</option><option value="medium">中等</option><option value="high">严重</option><option value="blocker">阻断</option></select></div>
      </section>

      <section className="studio-card curve-editor">
        <h3>绘制“开始—操作—结果”体验情绪曲线</h3>
        {["开始", "操作", "结果"].map((label, index) => <label key={label}>{label}<input max="2" min="-2" onChange={(event) => setCurve((current) => current.map((value, point) => point === index ? Number(event.target.value) : value))} type="range" value={curve[index]} /><b>{curve[index]}</b></label>)}
        <svg aria-label="体验情绪曲线" viewBox="0 0 300 120"><polyline fill="none" points={curve.map((value, index) => `${30 + index * 120},${60 - value * 22}`).join(" ")} stroke="#7c3aed" strokeWidth="5" />{curve.map((value, index) => <circle cx={30 + index * 120} cy={60 - value * 22} fill="#fff" key={index} r="7" stroke="#7c3aed" strokeWidth="4" />)}</svg>
        <button disabled={!readOnly} onClick={submitReview} type="button">提交只读试玩反馈</button>
      </section>

      <section className="studio-card feedback-organizer">
        <header><div><small>LOCAL AI CLUSTER DRAFT</small><h3>按页面、严重程度和类型整理反馈</h3></div><button onClick={organize} type="button">生成本地聚类草稿</button></header>
        <p className="local-ai-boundary">AI 只整理草稿；制作者必须修改总结并选择升级问题。</p>
        {clusters.map((item) => <article key={item.key}><b>{item.pageId} · {item.severity} · {item.problemType}</b><span>{item.count} 条相似反馈</span><small>{item.summary}</small></article>)}
        <label>学生修改后的总结<textarea onChange={(event) => setStudentSummary(event.target.value)} value={studentSummary} /></label>
        <label>选择一个功能问题<input onChange={(event) => setFeatureFix(event.target.value)} value={featureFix} /></label>
        <label>选择一个体验问题<input onChange={(event) => setExperienceFix(event.target.value)} value={experienceFix} /></label>
        <div className="studio-actions"><button onClick={() => setReadOnly(false)} type="button">返回创造台修改</button><button onClick={saveDecision} type="button">保存学生升级决定</button><button onClick={() => setRetested(true)} type="button">使用相同任务再次测试</button><button onClick={generateV2} type="button">比较 1.1 与 2.0 并生成升级说明</button></div>
        {comparison && <pre>{JSON.stringify(comparison, null, 2)}</pre>}
      </section>
    </div>
  );
}
