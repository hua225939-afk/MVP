"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ControlledProjectPreview,
} from "@/components/workbench/ControlledProjectPreview";
import { ToolPanel } from "@/components/workbench/tools/ToolPanel";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type ProjectHistory,
} from "@/lib/projects/project-history";
import {
  createDefaultProject,
  PROJECT_EDITABLE_FIELDS,
  type ProjectDocument,
} from "@/lib/projects/project-document";
import {
  getBrowserProjectRepository,
  projectContentChanges,
} from "@/lib/projects/project-repository";
import {
  courseToolRegistry,
  isCourseToolUnlocked,
} from "@/lib/tools/course-tool-registry";
import { PREVIEW_RENDERER_MODE } from "@/lib/workbench-config";

type WorkbenchMode = "canvas" | "code" | "preview" | "test" | "versions";
type AssistantAction = "idea" | "start" | "breakdown" | "explain" | "hint" | "test";

const modes: { id: WorkbenchMode; label: string }[] = [
  { id: "canvas", label: "画布" },
  { id: "code", label: "代码" },
  { id: "preview", label: "应用预览" },
  { id: "test", label: "测试" },
  { id: "versions", label: "版本" },
];

const assistantMessages: Record<AssistantAction, string[]> = {
  idea: ["这个想法要帮助谁？", "他在什么场景遇到问题？", "完成一次操作后，最希望看到什么结果？"],
  start: ["先写一个应用名称。", "再补充它服务的人。", "最后用一句话说明点击后要发生什么。"],
  breakdown: ["先确定输入：用户做什么。", "再确定处理：网页判断或记录什么。", "最后确定输出：用户看到什么反馈。"],
  explain: ["代码视图只展示课程工具生成的代码。", "预览由受控 React 组件渲染，不执行 eval、Function 或任意脚本。"],
  hint: ["先完成当前工具最小的一项输入。", "看看预览是否发生预期变化。", "如果测试失败，只修改一处后重新运行。"],
  test: ["检查应用名称和目标用户。", "点击主按钮观察反馈。", "修改上游内容后记得重新测试并保存版本。"],
};

function latestCode(project: ProjectDocument) {
  return [...project.artifacts]
    .reverse()
    .find((item) => item.type === "code")?.content ?? "还没有生成代码。请先在课程任务中保存一次创造结果。";
}

export function WorkbenchShell({ projectId }: { projectId: string }) {
  const [history, setHistory] = useState<ProjectHistory<ProjectDocument>>(() =>
    createHistory(createDefaultProject(projectId)),
  );
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [mode, setMode] = useState<WorkbenchMode>("canvas");
  const [creationMode, setCreationMode] = useState<"guided" | "free">("guided");
  const [activeToolId, setActiveToolId] = useState("intent-canvas");
  const [lockedMessage, setLockedMessage] = useState("");
  const [decisionTitle, setDecisionTitle] = useState("");
  const [assistantAction, setAssistantAction] = useState<AssistantAction>("start");
  const [assistantLevel, setAssistantLevel] = useState(0);
  const skipNextSave = useRef(true);
  const project = history.present;
  const activeTool =
    courseToolRegistry.find((item) => item.id === activeToolId) ??
    courseToolRegistry[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const repository = getBrowserProjectRepository();
      if (!repository) return;
      const loaded = repository.ensure(projectId);
      const requestedTool = new URLSearchParams(window.location.search).get("tool");
      if (requestedTool && courseToolRegistry.some((item) => item.id === requestedTool)) {
        setActiveToolId(requestedTool);
      }
      setHistory(createHistory(loaded));
      skipNextSave.current = true;
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [projectId]);

  useEffect(() => {
    if (!ready || skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      const repository = getBrowserProjectRepository();
      const stored = repository?.get(projectId);
      if (repository && stored) {
        repository.applyPatch(projectId, {
          projectId,
          baseRevision: stored.revision,
          source: "workbench",
          lessonId: activeTool.lessonId,
          toolId: activeTool.id,
          allowedFields: PROJECT_EDITABLE_FIELDS,
          changes: projectContentChanges(project),
          createdAt: new Date().toISOString(),
        });
      }
      setSaveState("saved");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [activeTool.id, activeTool.lessonId, project, projectId, ready]);

  const unlockedContext = useMemo(
    () => ({ availableLessonIds: ["lesson-01", "lesson-02", "lesson-06"], project }),
    [project],
  );
  const changeProject = (next: ProjectDocument) => {
    const now = new Date().toISOString();
    const upstreamChanged = activeTool.outputFields.some(
      (field) =>
        ["title", "audience", "scenario", "intent", "interactions", "state"].includes(field) &&
        JSON.stringify(project[field]) !== JSON.stringify(next[field]),
    );
    const invalidated = next.tests.map((item) =>
      upstreamChanged
        ? { ...item, status: "pending" as const, message: "项目已修改，请重新测试", updatedAt: now }
        : item,
    );
    setHistory((current) =>
      pushHistory(current, { ...next, tests: invalidated, updatedAt: now }),
    );
  };

  const runTests = () => {
    const now = new Date().toISOString();
    const checks = [
      { id: "project-title", name: "应用名称", passed: project.title.trim().length > 1, message: "填写至少两个字的应用名称" },
      { id: "project-audience", name: "目标用户", passed: project.audience.primary.trim().length > 1, message: "说明应用要帮助谁" },
      { id: "safe-preview", name: "安全预览", passed: PREVIEW_RENDERER_MODE === "controlled-react", message: "预览必须使用受控渲染器" },
    ];
    changeProject({
      ...project,
      tests: checks.map((check) => ({
        id: check.id,
        name: check.name,
        status: check.passed ? "pass" : "fail",
        projectRevision: project.revision,
        toolId: activeTool.id,
        message: check.passed ? "检查通过" : check.message,
        attempts: (project.tests.find((item) => item.id === check.id)?.attempts ?? 0) + 1,
        updatedAt: now,
      })),
    });
  };

  const createVersion = () => {
    const repository = getBrowserProjectRepository();
    const stored = repository?.get(projectId);
    if (!repository || !stored) return;
    const saved = repository.applyPatch(projectId, {
      projectId,
      baseRevision: stored.revision,
      source: "workbench",
      lessonId: activeTool.lessonId,
      toolId: activeTool.id,
      allowedFields: PROJECT_EDITABLE_FIELDS,
      changes: projectContentChanges(project),
      createdAt: new Date().toISOString(),
    });
    const versioned = repository.createVersion(
      projectId,
      `版本 ${saved.versions.length + 1}`,
      "从创造台手动保存",
    );
    if (versioned) {
      skipNextSave.current = true;
      setHistory((current) => pushHistory(current, versioned));
    }
  };

  const restoreVersion = (versionId: string) => {
    if (!window.confirm("恢复这个版本？当前版本记录会保留。")) return;
    const restored = getBrowserProjectRepository()?.restoreVersion(
      projectId,
      versionId,
    );
    if (restored) {
      skipNextSave.current = true;
      setHistory((current) => pushHistory(current, restored));
    }
  };

  const addDecision = () => {
    if (!decisionTitle.trim()) return;
    changeProject({
      ...project,
      decisions: [
        ...project.decisions,
        {
          id: `decision-${Date.now()}`,
          lessonId: activeTool.lessonId,
          toolId: activeTool.id,
          title: decisionTitle.trim(),
          reason: `在${creationMode === "guided" ? "引导创造" : "自由创造"}模式记录`,
          suggestedBy: "student",
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setDecisionTitle("");
  };

  const selectTool = (toolId: string) => {
    const definition = courseToolRegistry.find((item) => item.id === toolId)!;
    if (!isCourseToolUnlocked(definition, unlockedContext)) {
      setLockedMessage(`${definition.name}将在第 ${definition.lessonOrder} 课解锁：${definition.unlockCondition}`);
      return;
    }
    setLockedMessage("");
    setActiveToolId(toolId);
    setMode("canvas");
  };

  const historyAction = (kind: "undo" | "redo") => {
    setHistory((current) =>
      kind === "undo" ? undoHistory(current) : redoHistory(current),
    );
  };

  if (!ready) {
    return <main className="workbench-loading">正在打开造物项目…</main>;
  }

  const assistantLines = assistantMessages[assistantAction];

  return (
    <main className="workbench-shell">
      <header className="workbench-topbar">
        <Link className="workbench-brand" href="/student">
          <span>V</span><b>造物星球</b>
        </Link>
        <nav aria-label="学生导航">
          <Link href="/student">创造基地</Link>
          <Link aria-current="page" href={`/student/workbench/${projectId}`}>创造台</Link>
          <Link href="/student/projects">我的作品</Link>
          <Link href="/student/courses">学习中心</Link>
          <span aria-disabled="true">作品广场</span>
          <span aria-disabled="true">成就</span>
        </nav>
        <div className="workbench-save-state">
          <i className={saveState} />{saveState === "saved" ? "已自动保存" : "保存中…"}
        </div>
      </header>

      <div className="workbench-body">
        <aside className="plugin-center">
          <div className="panel-heading"><small>PLUGIN CENTER</small><h2>插件中心</h2></div>
          <div className="tool-list">
            {courseToolRegistry.map((definition) => {
              const unlocked = isCourseToolUnlocked(definition, unlockedContext);
              return (
                <button
                  aria-pressed={activeToolId === definition.id}
                  className={activeToolId === definition.id ? "active" : ""}
                  key={definition.id}
                  onClick={() => selectTool(definition.id)}
                  type="button"
                >
                  <span>{String(definition.lessonOrder).padStart(2, "0")}</span>
                  <b>{definition.name}</b>
                  <i>{unlocked ? "已解锁" : "锁定"}</i>
                </button>
              );
            })}
          </div>
          {lockedMessage && <p className="locked-tool-message">{lockedMessage}</p>}
        </aside>

        <section className="creation-stage">
          <div className="stage-toolbar">
            <div>
              <small>正在创造</small>
              <h1>{project.title}</h1>
            </div>
            <div className="history-actions">
              <button disabled={history.past.length === 0} onClick={() => historyAction("undo")} type="button">↶ 撤销</button>
              <button disabled={history.future.length === 0} onClick={() => historyAction("redo")} type="button">↷ 重做</button>
            </div>
            <div className="creation-mode" aria-label="创造模式">
              <button aria-pressed={creationMode === "guided"} onClick={() => setCreationMode("guided")} type="button">引导创造</button>
              <button aria-pressed={creationMode === "free"} onClick={() => setCreationMode("free")} type="button">自由创造</button>
            </div>
          </div>

          <div className="mode-tabs" role="tablist">
            {modes.map((item) => (
              <button aria-selected={mode === item.id} key={item.id} onClick={() => setMode(item.id)} role="tab" type="button">{item.label}</button>
            ))}
          </div>

          <div className="stage-content">
            {mode === "canvas" && (
              <section>
                <div className="canvas-heading">
                  <div><small>第 {activeTool.lessonOrder} 课工具</small><h2>{activeTool.name}</h2></div>
                  <span>{creationMode === "guided" ? activeTool.basicMode.summary : activeTool.freeMode.summary}</span>
                </div>
                <ToolPanel definition={activeTool} onChange={changeProject} project={project} />
              </section>
            )}
            {mode === "code" && (
              <section className="code-view">
                <div><span /><span /><span /><small>只读代码视图</small></div>
                <pre><code>{latestCode(project)}</code></pre>
                <p>代码来自已注册课程工具，仅供查看；预览不会执行这里的任意脚本。</p>
              </section>
            )}
            {mode === "preview" && <ControlledProjectPreview project={project} />}
            {mode === "test" && (
              <section className="test-center">
                <div className="canvas-heading"><div><small>TEST CENTER</small><h2>项目测试</h2></div><button onClick={runTests} type="button">运行全部测试</button></div>
                {project.tests.length === 0 ? <p>还没有测试记录。运行测试后，失败项可以修改并重试。</p> : (
                  <div className="test-list">{project.tests.map((item) => <article key={item.id} className={item.status}><b>{item.status === "pass" ? "✓" : item.status === "fail" ? "!" : "↻"} {item.name}</b><span>{item.message}</span><small>已运行 {item.attempts} 次</small></article>)}</div>
                )}
              </section>
            )}
            {mode === "versions" && (
              <section className="version-center">
                <div className="canvas-heading"><div><small>VERSION RECORD</small><h2>版本记录</h2></div><button onClick={createVersion} type="button">保存版本快照</button></div>
                {project.versions.length === 0 ? <p>还没有版本快照。重要修改前后各保存一次，方便对比。</p> : project.versions.map((version) => <article key={version.id}><b>{version.label}</b><span>项目修订 {version.revision}</span><small>{new Date(version.createdAt).toLocaleString("zh-CN")}</small><button onClick={() => restoreVersion(version.id)} type="button">恢复</button></article>)}
              </section>
            )}
          </div>
        </section>

        <aside className="creation-assistant">
          <div className="panel-heading"><small>LOCAL GUIDE</small><h2>创造助手</h2></div>
          <p className="local-assistant-notice">当前是本地引导助手，使用预设追问与提示，没有连接真实 AI。</p>
          <div className="assistant-actions">
            {([
              ["idea", "我有想法"],
              ["start", "我不知道从哪里开始"],
              ["breakdown", "帮我拆解任务"],
              ["explain", "解释代码"],
              ["hint", "给我提示"],
              ["test", "帮我检查问题"],
            ] as [AssistantAction, string][]).map(([id, label]) => (
              <button aria-pressed={assistantAction === id} key={id} onClick={() => { setAssistantAction(id); setAssistantLevel(0); }} type="button">{label}</button>
            ))}
          </div>
          <div className="assistant-dialog">
            <small>第 {assistantLevel + 1} 级帮助</small>
            <p>{assistantLines[Math.min(assistantLevel, assistantLines.length - 1)]}</p>
            <button disabled={assistantLevel >= assistantLines.length - 1} onClick={() => setAssistantLevel((value) => value + 1)} type="button">再具体一点 →</button>
          </div>
        </aside>
      </div>

      <footer className="workbench-drawer">
        <section>
          <b>技能工具</b>
          <span>{activeTool.name}</span><span>{creationMode === "guided" ? "引导模式" : "自由模式"}</span>
        </section>
        <section className="decision-entry">
          <b>造物决定</b>
          <input onChange={(event) => setDecisionTitle(event.target.value)} placeholder="记录这次为什么这样改" value={decisionTitle} />
          <button onClick={addDecision} type="button">保存决定</button>
        </section>
        <section><b>造物轨迹</b><span>{project.decisions.length} 条决定</span><span>{project.tests.length} 条测试</span><span>{project.versions.length} 个版本</span></section>
      </footer>
    </main>
  );
}
