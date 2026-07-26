"use client";
/* eslint-disable @next/next/no-img-element -- 页面草图需要复用 ProjectDocument 中的本地画板 data URL。 */

import { useMemo, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  safeHtmlToStructure,
  scanStructure,
  structureToHtml,
} from "@/lib/unit-two/creative-tools";
import { demoStructureSuggestion } from "@/lib/ai/creative-ai-service";

type Panel = "xray" | "sketch" | "structure";
type SketchRegion = { id: string; pageId: string; kind: string; label: string; note: string; order: number };

const xrayCases = [
  {
    id: "recipe",
    name: "周末食谱",
    purpose: "帮助家人找到并开始一道菜",
    nodes: [
      ["header", "网站名称与导航", null],
      ["main", "本页主要内容", null],
      ["h1", "周末一起做披萨", "main"],
      ["section", "食材卡片", "main"],
      ["button", "开始制作", "section"],
      ["footer", "来源与说明", null],
    ],
  },
  {
    id: "club",
    name: "校园社团招新",
    purpose: "让同学了解社团并报名",
    nodes: [
      ["nav", "社团分类导航", null],
      ["main", "招新信息", null],
      ["article", "机器人社团卡", "main"],
      ["img", "活动照片", "article"],
      ["button", "填写报名", "article"],
      ["footer", "联系时间", null],
    ],
  },
  {
    id: "tracker",
    name: "习惯打卡",
    purpose: "记录今天的完成情况",
    nodes: [
      ["header", "今日日期", null],
      ["main", "打卡任务", null],
      ["section", "喝水进度", "main"],
      ["input", "填写杯数", "section"],
      ["button", "保存记录", "section"],
      ["footer", "连续天数", null],
    ],
  },
] as const;

const sketchKinds = ["标题", "图片", "卡片", "按钮", "输入", "结果", "便签"] as const;
const htmlTags = ["header", "main", "section", "footer", "nav", "article", "div", "h1", "h2", "p", "img", "button", "input", "ul", "li"] as const;

function readSketch(project: ProjectDocument): SketchRegion[] {
  const artifact = project.artifacts.find((item) => item.id === "lesson-03.layout-sketch");
  try {
    return artifact ? JSON.parse(artifact.content) as SketchRegion[] : [];
  } catch {
    return [];
  }
}

export function PageStructureStudio({
  project,
  onChange,
}: {
  project: ProjectDocument;
  onChange: (project: ProjectDocument) => void;
}) {
  const requestedPanel = typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("panel");
  const [panel, setPanel] = useState<Panel>(
    requestedPanel === "xray" || requestedPanel === "sketch" || requestedPanel === "structure"
      ? requestedPanel
      : "xray",
  );
  const [xrayCase, setXrayCase] = useState(0);
  const [xrayMode, setXrayMode] = useState<"normal" | "outline" | "tags">("normal");
  const [selectedXray, setSelectedXray] = useState(0);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [sketch, setSketch] = useState<SketchRegion[]>(() => readSketch(project));
  const [selectedNodeId, setSelectedNodeId] = useState(project.structure[0]?.id ?? "");
  const [code, setCode] = useState(() => structureToHtml(project));
  const [compareDraft, setCompareDraft] = useState<ProjectDocument["structure"] | null>(null);
  const currentCase = xrayCases[xrayCase];
  const selectedNode = project.structure.find((node) => node.id === selectedNodeId);
  const checks = useMemo(() => scanStructure(project), [project]);
  const now = () => new Date().toISOString();

  const update = (changes: Partial<ProjectDocument>) => onChange({ ...project, ...changes });
  const saveSketch = (next = sketch) => {
    const timestamp = now();
    setSketch(next);
    update({
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-03.layout-sketch"),
        {
          id: "lesson-03.layout-sketch",
          type: "document",
          name: "页面草图",
          content: JSON.stringify(next),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    });
  };

  const generateDraft = () => {
    const draft = demoStructureSuggestion(project);
    const timestamp = now();
    setCompareDraft(draft.structure);
    update({
      pages: draft.pages,
      structure: draft.structure,
      aiDrafts: [
        ...project.aiDrafts,
        {
          id: `ai-structure-${Date.now()}`,
          lessonId: "lesson-03",
          kind: "structure",
          payload: JSON.stringify(draft),
          generatedAt: timestamp,
          disclaimer: "本地结构规则读取第2课任务与页面草图，不理解未标注的自由线条。",
        },
      ],
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-03.structure.html"),
        {
          id: "lesson-03.structure.html",
          type: "code",
          name: "HTML 页面骨架",
          content: structureToHtml({ ...project, ...draft }),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    });
    setCode(structureToHtml({ ...project, ...draft }));
    setPanel("structure");
  };

  const setStructure = (structure: ProjectDocument["structure"], reason = "") => {
    const timestamp = now();
    const nextProject = { ...project, structure };
    const html = structureToHtml(nextProject);
    setCode(html);
    update({
      structure,
      studentRevisions: reason
        ? [...project.studentRevisions, {
            id: `revision-structure-${Date.now()}`,
            draftId: project.aiDrafts.filter((item) => item.kind === "structure").at(-1)?.id ?? "student-only",
            lessonId: "lesson-03",
            kind: "structure",
            payload: JSON.stringify(structure),
            reason,
            confirmedAt: timestamp,
          }]
        : project.studentRevisions,
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-03.structure.html"),
        {
          id: "lesson-03.structure.html",
          type: "code",
          name: "HTML 页面骨架",
          content: html,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    });
  };

  const changeNode = (changes: Partial<ProjectDocument["structure"][number]>) => {
    if (!selectedNode) return;
    setStructure(project.structure.map((node) => node.id === selectedNode.id ? { ...node, ...changes } : node));
  };

  const moveNode = (direction: -1 | 1) => {
    if (!selectedNode) return;
    const siblings = project.structure
      .filter((node) => node.pageId === selectedNode.pageId && node.parentId === selectedNode.parentId)
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((node) => node.id === selectedNode.id);
    const other = siblings[index + direction];
    if (!other) return;
    setStructure(project.structure.map((node) =>
      node.id === selectedNode.id ? { ...node, order: other.order } :
        node.id === other.id ? { ...node, order: selectedNode.order } : node
    ));
  };

  const addNode = () => {
    const pageId = selectedNode?.pageId ?? project.pages[0]?.id;
    if (!pageId) return;
    const id = `node-student-${Date.now()}`;
    setSelectedNodeId(id);
    setStructure([...project.structure, {
      id,
      pageId,
      parentId: selectedNode?.id ?? null,
      type: "section",
      htmlTag: "section",
      order: project.structure.filter((node) => node.parentId === (selectedNode?.id ?? null)).length,
      content: "新页面区域",
    }]);
  };

  return (
    <div className="unit-two-studio">
      <nav className="tool-journey" aria-label="页面骨架工作区">
        <button aria-pressed={panel === "xray"} onClick={() => setPanel("xray")} type="button">1 网页透视 WebXRay</button>
        <button aria-pressed={panel === "sketch"} onClick={() => setPanel("sketch")} type="button">2 页面草图</button>
        <button aria-pressed={panel === "structure"} onClick={() => setPanel("structure")} type="button">3 结构构建</button>
      </nav>

      {panel === "xray" && (
        <section className="xray-studio">
          <div className="studio-toolbar">
            {xrayCases.map((item, index) => <button aria-pressed={xrayCase === index} key={item.id} onClick={() => { setXrayCase(index); setSelectedXray(0); setRevealed(false); }} type="button">{item.name}</button>)}
            <span />
            {(["normal", "outline", "tags"] as const).map((mode) => <button aria-pressed={xrayMode === mode} key={mode} onClick={() => setXrayMode(mode)} type="button">{{ normal: "正常页面", outline: "结构框线", tags: "HTML 标签" }[mode]}</button>)}
          </div>
          <div className={`xray-page ${xrayMode}`}>
            {currentCase.nodes.map(([tag, label, parent], index) => {
              const hidden = parent && collapsed.includes(parent);
              if (hidden) return null;
              return (
                <button
                  className={selectedXray === index ? "selected" : ""}
                  data-tag={tag}
                  key={`${tag}-${index}`}
                  onClick={() => { setSelectedXray(index); setRevealed(false); setGuess(""); }}
                  type="button"
                >
                  {tag === "img" ? "▧ 生活图片" : tag === "input" ? "输入内容…" : label}
                </button>
              );
            })}
          </div>
          <aside className="xray-inspector">
            <small>点击区域后同步定位 HTML</small>
            <code>{`<${currentCase.nodes[selectedXray][0]}>${currentCase.nodes[selectedXray][1]}</${currentCase.nodes[selectedXray][0]}>`}</code>
            <p>层级：{currentCase.nodes[selectedXray][2] ? `${currentCase.nodes[selectedXray][2]} › ` : ""}{currentCase.nodes[selectedXray][0]}</p>
            <button onClick={() => {
              const tag = currentCase.nodes[selectedXray][0];
              setCollapsed((items) => items.includes(tag) ? items.filter((item) => item !== tag) : [...items, tag]);
            }} type="button">{collapsed.includes(currentCase.nodes[selectedXray][0]) ? "展开子结构" : "折叠子结构"}</button>
            <label>先猜它的作用<input onChange={(event) => setGuess(event.target.value)} value={guess} /></label>
            <button disabled={guess.trim().length < 2} onClick={() => setRevealed(true)} type="button">揭示区域作用</button>
            {revealed && <p className="reveal-answer">{currentCase.purpose}；这个区域负责“{currentCase.nodes[selectedXray][1]}”。</p>}
          </aside>
        </section>
      )}

      {panel === "sketch" && (
        <section className="layout-sketch">
          <div className="studio-toolbar">
            {sketchKinds.map((kind) => <button key={kind} onClick={() => saveSketch([...sketch, { id: `sketch-${Date.now()}`, pageId: project.pages[0]?.id ?? "page-home", kind, label: kind, note: "", order: sketch.length }])} type="button">+ {kind}</button>)}
            <button onClick={() => saveSketch([...sketch, { id: `arrow-${Date.now()}`, pageId: project.pages[0]?.id ?? "page-home", kind: "箭头", label: "下一步 →", note: "", order: sketch.length }])} type="button">+ 顺序箭头</button>
            <button onClick={() => {
              const id = `page-student-${Date.now()}`;
              update({ pages: [...project.pages, { id, name: `页面 ${project.pages.length + 1}`, slug: `page-${project.pages.length + 1}`, order: project.pages.length, structureRootIds: [] }] });
            }} type="button">+ 页面</button>
          </div>
          <p>点击添加区域，再用上下移动表达页面顺序；平板不依赖精准拖拽。</p>
          <div className="sketch-pages">
            {project.pages.map((page) => (
              <article key={page.id}>
                <header><b>{page.name}</b><small>{page.slug}</small></header>
                {sketch.filter((item) => item.pageId === page.id).sort((a, b) => a.order - b.order).map((item) => (
                  <div className="sketch-region" key={item.id}>
                    <span>{item.kind}</span>
                    <input aria-label="区域标签" onChange={(event) => setSketch((items) => items.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} value={item.label} />
                    <input aria-label="文字便签" onChange={(event) => setSketch((items) => items.map((entry) => entry.id === item.id ? { ...entry, note: event.target.value } : entry))} placeholder="便签" value={item.note} />
                    <button onClick={() => saveSketch(sketch.map((entry) => entry.id === item.id ? { ...entry, order: Math.max(0, entry.order - 1) } : entry))} type="button">↑</button>
                    <button onClick={() => saveSketch(sketch.map((entry) => entry.id === item.id ? { ...entry, order: entry.order + 1 } : entry))} type="button">↓</button>
                    <button onClick={() => saveSketch(sketch.filter((entry) => entry.id !== item.id))} type="button">删除</button>
                  </div>
                ))}
              </article>
            ))}
          </div>
          <details><summary>导入第1课画板素材</summary><p>已读取 {project.sketch.elements.length} 个画板元素和 {project.interestMap.nodes.length} 个兴趣素材。</p>{project.sketch.compressedImage && <img alt="第1课画板" src={project.sketch.compressedImage} />}</details>
          <div className="studio-actions">
            <button onClick={() => saveSketch()} type="button">保存页面草图</button>
            <button className="button button-primary" disabled={sketch.length < 2} onClick={generateDraft} type="button">AI 将草图转为结构建议</button>
          </div>
        </section>
      )}

      {panel === "structure" && (
        <section className="structure-builder">
          <div className="structure-columns">
            <div className="structure-canvas-panel">
              <header><b>结构画布</b><button onClick={addNode} type="button">+ 区域</button></header>
              <div className="structure-tree">
                {[...project.structure].sort((a, b) => a.order - b.order).map((node) => (
                  <button className={selectedNodeId === node.id ? "selected" : ""} key={node.id} onClick={() => setSelectedNodeId(node.id)} style={{ marginLeft: `${node.parentId ? 20 : 0}px` }} type="button"><code>{node.htmlTag ?? node.type}</code>{node.content || "空容器"}</button>
                ))}
              </div>
              {selectedNode && <div className="node-editor">
                <label>HTML 标签<select onChange={(event) => changeNode({ htmlTag: event.target.value as typeof selectedNode.htmlTag })} value={selectedNode.htmlTag ?? "div"}>{htmlTags.map((tag) => <option key={tag}>{tag}</option>)}</select></label>
                <label>文字<input onChange={(event) => changeNode({ content: event.target.value })} value={selectedNode.content} /></label>
                <label>父级<select onChange={(event) => changeNode({ parentId: event.target.value || null })} value={selectedNode.parentId ?? ""}><option value="">顶层</option>{project.structure.filter((node) => node.id !== selectedNode.id && node.pageId === selectedNode.pageId).map((node) => <option key={node.id} value={node.id}>{node.content || node.htmlTag}</option>)}</select></label>
                <button onClick={() => moveNode(-1)} type="button">上移</button><button onClick={() => moveNode(1)} type="button">下移</button>
                <button onClick={() => {
                  const id = `node-copy-${Date.now()}`;
                  setStructure([...project.structure, { ...selectedNode, id, order: selectedNode.order + 1 }]);
                  setSelectedNodeId(id);
                }} type="button">复制</button>
                <button onClick={() => setStructure(project.structure.filter((node) => node.id !== selectedNode.id && node.parentId !== selectedNode.id))} type="button">删除</button>
              </div>}
            </div>
            <div className="structure-code-panel">
              <header><b>HTML 代码</b><button onClick={() => setCode(`${code}\n<section>\n  新区域\n</section>`)} type="button">局部补全 section</button></header>
              <textarea aria-label="HTML 代码编辑器" onChange={(event) => setCode(event.target.value)} value={code} />
              <button onClick={() => {
                const pageId = project.pages[0]?.id;
                if (pageId) setStructure(safeHtmlToStructure(code, pageId), "学生修改 HTML 后同步结构");
              }} type="button">应用安全 HTML 修改</button>
            </div>
            <div className="structure-preview-panel">
              <header><b>应用预览</b></header>
              <div className="structure-preview">
                {project.structure.filter((node) => node.content).slice(0, 12).map((node) => (
                  <div className={`structure-preview-node preview-${node.type}`} key={node.id}>
                    {node.type === "button" ? <button type="button">{node.content}</button> : node.type === "input" ? <input placeholder={node.content} /> : <span>{node.content}</span>}
                    <label>
                      <small>在预览中修改</small>
                      <input
                        aria-label={`在预览中修改${node.content}`}
                        onChange={(event) => setStructure(project.structure.map((item) => item.id === node.id ? { ...item, content: event.target.value } : item))}
                        value={node.content}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="structure-scan">
            {checks.map((check) => <p className={check.passed ? "pass" : "fail"} key={check.id}>{check.passed ? "✓" : "!"} {check.name}</p>)}
            <button onClick={() => {
              const timestamp = now();
              update({ tests: [...project.tests.filter((item) => item.toolId !== "page-structure"), ...checks.map((check) => ({ id: `lesson-03-${check.id}`, name: check.name, status: check.passed ? "pass" as const : "fail" as const, projectRevision: project.revision, toolId: "page-structure", message: check.passed ? "结构检查通过" : "定位到结构画布中的对应区域，请修复后重测", attempts: (project.tests.find((item) => item.id === `lesson-03-${check.id}`)?.attempts ?? 0) + 1, updatedAt: timestamp }))] });
            }} type="button">运行结构扫描</button>
            <button disabled={!compareDraft} onClick={() => setStructure(project.structure, "比较 AI 结构后确认学生最终结构")} type="button">确认学生最终结构</button>
          </div>
          {compareDraft && <details><summary>比较 AI 结构与学生最终结构</summary><p>AI：{compareDraft.length} 个区域；学生最终：{project.structure.length} 个区域。</p><pre>{JSON.stringify(compareDraft, null, 2)}</pre></details>}
        </section>
      )}
    </div>
  );
}
