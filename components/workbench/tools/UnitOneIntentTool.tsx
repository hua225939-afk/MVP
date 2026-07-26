"use client";
/* eslint-disable @next/next/no-img-element -- 场景与学生参考图是浏览器内生成的数据 URL，不能由 next/image 优化。 */

import { useMemo, useState } from "react";
import { IdeaCanvas, compressImageFile } from "./IdeaCanvas";
import { DemoAIService, LiveAIService, withRetry } from "@/lib/ai/creative-ai-service";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { LIFE_SCENES, sceneIllustration, unitOneChecks } from "@/lib/unit-one/creative-tools";

type Tab = "scenes" | "map" | "canvas" | "intent" | "prototype" | "test";
const categoryLabels = {
  learning: "学习",
  campus: "校园",
  interest: "兴趣",
  habit: "习惯",
  family: "家庭",
  community: "社区",
} as const;
const roleLabels = { like: "我喜欢什么", problem: "我发现什么问题", audience: "我想帮助谁" } as const;

export function UnitOneIntentTool({
  project,
  onChange,
}: {
  project: ProjectDocument;
  onChange: (project: ProjectDocument) => void;
}) {
  const [tab, setTab] = useState<Tab>("scenes");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [studentNote, setStudentNote] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const scene = LIFE_SCENES[sceneIndex];
  const image = sceneIllustration(scene);
  const checks = useMemo(() => unitOneChecks(project), [project]);

  const update = (changes: Partial<ProjectDocument>) => onChange({ ...project, ...changes });
  const addSource = (
    marker: ProjectDocument["inspirationSources"][number]["marker"],
    hotspotId: string | null,
    detail: string = scene.detail,
    imageData: string = image,
  ) => {
    const id = `${scene.id}:${hotspotId ?? "scene"}:${marker}`;
    const source = {
      id,
      category: scene.category,
      title: scene.title,
      detail,
      imageData,
      hotspotId,
      marker,
    };
    const sources = [...project.inspirationSources.filter((item) => item.id !== id), source];
    const role = marker === "solve" ? "problem" as const : marker === "curious" ? "audience" as const : "like" as const;
    const node = {
      id: `node-${id}`,
      category: scene.category,
      label: hotspotId ? detail.slice(0, 18) : scene.title,
      detail,
      imageData,
      sourceId: id,
      role,
      color: scene.color,
      icon: marker === "solve" ? "!" : marker === "curious" ? "?" : "♥",
    };
    update({
      inspirationSources: sources,
      interestMap: {
        ...project.interestMap,
        nodes: [...project.interestMap.nodes.filter((item) => item.id !== node.id), node],
      },
    });
  };

  const generateIntent = async () => {
    setAiState("loading");
    setAiError("");
    const input = {
      interestMap: project.interestMap,
      inspirationSources: project.inspirationSources,
      keywords: project.keywords,
      notes: project.sketch.elements.filter((item) => item.text).map((item) => item.text),
      sketchImage: project.sketch.compressedImage,
      studentNote,
    };
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 22_000);
    try {
      const service = navigator.onLine ? new LiveAIService() : new DemoAIService();
      const result = await withRetry(() => service.understand(input, controller.signal), 1);
      update({
        aiDraft: result.output,
        studentRevision: result.output,
        aiMode: result.mode,
        aiProvenance: result.provenance,
      });
      setAiState("idle");
    } catch (error) {
      setAiState("error");
      setAiError(error instanceof Error ? error.message : "生成失败，请重试");
    } finally {
      window.clearTimeout(timer);
    }
  };

  const reviseIntent = (field: keyof NonNullable<ProjectDocument["studentRevision"]>, value: string | string[]) => {
    const base = project.studentRevision ?? project.aiDraft;
    if (!base) return;
    update({ studentRevision: { ...base, [field]: value } });
  };
  const rewriteOne = async (field: keyof NonNullable<ProjectDocument["studentRevision"]>) => {
    setAiState("loading");
    try {
      const service = navigator.onLine ? new LiveAIService() : new DemoAIService();
      const result = await withRetry(() => service.understand({
        interestMap: project.interestMap,
        inspirationSources: project.inspirationSources,
        keywords: project.keywords,
        notes: [...project.sketch.elements.map((item) => item.text), `只改写字段：${field}`],
        sketchImage: project.sketch.compressedImage,
        studentNote,
      }), 1);
      reviseIntent(field, result.output[field]);
      setAiState("idle");
    } catch (error) {
      setAiState("error");
      setAiError(error instanceof Error ? error.message : "单项重写失败");
    }
  };

  const savePrototype = () => {
    const final = project.finalIntent;
    if (!final) return;
    const title = project.title.trim() || "我的生活 App";
    const structure = [
      { id: "node-title", pageId: "page-home", parentId: null, type: "heading" as const, order: 0, content: final.appIntent },
      { id: "node-message", pageId: "page-home", parentId: null, type: "text" as const, order: 1, content: final.problem },
      { id: "node-action", pageId: "page-home", parentId: null, type: "button" as const, order: 2, content: String(project.components[0]?.props.label || "开始体验") },
    ];
    const now = new Date().toISOString();
    update({
      title,
      audience: { primary: final.audience, needs: [final.problem] },
      scenario: { context: final.scenario, problem: final.problem },
      intent: { statement: final.appIntent, expectedOutcome: final.possibleOutputs.join("、") },
      pages: [{ id: "page-home", name: "首页", slug: "home", order: 0, structureRootIds: structure.map((item) => item.id) }],
      structure,
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-01.prototype"),
        { id: "lesson-01.prototype", type: "preview", name: "第1课网页原型", content: JSON.stringify({ title, final }), createdAt: now, updatedAt: now },
      ],
    });
  };

  return (
    <div className="unit-one-tool">
      <nav className="tool-journey" aria-label="第1课创造流程">
        {([
          ["scenes", "1 场景探索"], ["map", "2 兴趣地图"], ["canvas", "3 创意画板"],
          ["intent", "4 AI意图编辑"], ["prototype", "5 网页原型"], ["test", "6 试航"],
        ] as const).map(([id, label]) => (
          <button aria-pressed={tab === id} key={id} onClick={() => setTab(id)} type="button">{label}</button>
        ))}
      </nav>

      {tab === "scenes" && (
        <section className="scene-explorer">
          <div className="scene-stage">
            <img alt={`${scene.title}：${scene.detail}`} src={image} />
            {scene.hotspots.map((hotspot) => (
              <button
                aria-label={`查看问题：${hotspot.question}`}
                className="scene-hotspot"
                key={hotspot.id}
                onClick={() => setActiveHotspot(hotspot.id)}
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                type="button"
              >+</button>
            ))}
            <button className="scene-arrow previous" onClick={() => setSceneIndex((sceneIndex + LIFE_SCENES.length - 1) % LIFE_SCENES.length)} type="button">‹</button>
            <button className="scene-arrow next" onClick={() => setSceneIndex((sceneIndex + 1) % LIFE_SCENES.length)} type="button">›</button>
          </div>
          <div className="scene-copy"><small>{categoryLabels[scene.category]}</small><h3>{scene.title}</h3><p>{scene.detail}</p></div>
          {scene.hotspots.filter((item) => item.id === activeHotspot).map((hotspot) => (
            <div className="hotspot-question" key={hotspot.id}>
              <b>{hotspot.question}</b>
              <div>
                <button onClick={() => addSource("like", hotspot.id, hotspot.question)} type="button">喜欢</button>
                <button onClick={() => addSource("curious", hotspot.id, hotspot.question)} type="button">好奇</button>
                <button onClick={() => addSource("solve", hotspot.id, hotspot.question)} type="button">想解决</button>
              </div>
            </div>
          ))}
          <div className="scene-actions">
            <button onClick={() => addSource("favorite", null)} type="button">收藏整个场景</button>
            <label className="upload-chip">上传参考图片
              <input accept="image/*" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const data = await compressImageFile(file);
                addSource("favorite", null, "学生上传的生活参考图", data);
              }} type="file" />
            </label>
          </div>
          <div className="scene-thumbnails">
            {LIFE_SCENES.map((item, index) => (
              <button aria-current={index === sceneIndex} key={item.id} onClick={() => setSceneIndex(index)} type="button">
                <img alt="" src={sceneIllustration(item)} /><span>{item.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "map" && (
        <section className="interest-map">
          <div className="interest-map-toolbar">
            <button onClick={() => {
              const label = window.prompt("添加什么兴趣、问题或想帮助的人？")?.trim();
              if (!label) return;
              update({ interestMap: { ...project.interestMap, nodes: [...project.interestMap.nodes, {
                id: `node-custom-${Date.now()}`, category: "interest", label, detail: label, imageData: "", sourceId: null,
                role: "like", color: "#6A4C78", icon: "+",
              }] } });
            }} type="button">+ 自定义节点</button>
            <button disabled={selectedNodes.length < 2} onClick={() => {
              const statement = selectedNodes.map((id) => project.interestMap.nodes.find((item) => item.id === id)?.label).join(" → ");
              update({ interestMap: { ...project.interestMap, links: [...project.interestMap.links, { id: `link-${Date.now()}`, nodeIds: selectedNodes, statement }] } });
              setSelectedNodes([]);
            }} type="button">建立联系（2—3个节点）</button>
          </div>
          <div className="map-columns">
            {(["like", "problem", "audience"] as const).map((role) => (
              <section key={role}><h3>{roleLabels[role]}</h3>
                {project.interestMap.nodes.filter((item) => item.role === role).map((node) => (
                  <article className={selectedNodes.includes(node.id) ? "selected" : ""} key={node.id} style={{ borderColor: node.color }}>
                    {node.imageData && <img alt="" src={node.imageData} />}
                    <button onClick={() => setSelectedNodes((current) => current.includes(node.id) ? current.filter((id) => id !== node.id) : current.length < 3 ? [...current, node.id] : current)} type="button">
                      <span>{node.icon}</span><b>{node.label}</b><small>{categoryLabels[node.category]}</small>
                    </button>
                    {node.sourceId && <button onClick={() => {
                      const sourceSceneId = node.sourceId?.split(":")[0];
                      const index = LIFE_SCENES.findIndex((item) => item.id === sourceSceneId);
                      if (index >= 0) setSceneIndex(index);
                      setTab("scenes");
                    }} type="button">查看原图</button>}
                    <button aria-label={`删除${node.label}`} onClick={() => update({ interestMap: { nodes: project.interestMap.nodes.filter((item) => item.id !== node.id), links: project.interestMap.links.filter((link) => !link.nodeIds.includes(node.id)) } })} type="button">×</button>
                  </article>
                ))}
              </section>
            ))}
          </div>
          <div className="map-links">{project.interestMap.links.map((link) => <p key={link.id}>关系：{link.statement}</p>)}</div>
        </section>
      )}

      {tab === "canvas" && <IdeaCanvas keywords={project.keywords} onChange={(sketch, keywords) => update({ sketch, keywords })} value={project.sketch} />}

      {tab === "intent" && (
        <section className="intent-editor">
          <label>补充 AI 没理解的内容<textarea onChange={(event) => setStudentNote(event.target.value)} placeholder="可以使用不完整句子，例如：给总忘带东西的人；希望安静一点" value={studentNote} /></label>
          <button className="button button-primary" disabled={aiState === "loading"} onClick={generateIntent} type="button">
            {aiState === "loading" ? "正在整理图文线索…" : project.aiDraft ? "重新生成 AI 草稿" : "生成 AI 意图草稿"}
          </button>
          {aiState === "error" && <p className="ai-error">{aiError} <button onClick={generateIntent} type="button">重试</button></p>}
          {project.aiProvenance && <p className={`ai-mode ${project.aiMode}`}>{project.aiMode === "demo" ? "本地规则演示" : "Live AI"} · {project.aiProvenance.disclaimer}</p>}
          {project.aiDraft && project.studentRevision && (
            <>
              <div className="intent-compare">
                <section><h3>AI 原稿</h3><p>{project.aiDraft.appIntent}</p><p>{project.aiDraft.audience}</p><p>{project.aiDraft.problem}</p><p>{project.aiDraft.coreFunctions.join("、")}</p><p>{project.aiDraft.visualStyle}</p></section>
                <section><h3>学生修改稿</h3>
                  <label>一句话 App 意图<input onChange={(event) => reviseIntent("appIntent", event.target.value)} value={project.studentRevision.appIntent} /></label>
                  <label>服务对象<input onChange={(event) => reviseIntent("audience", event.target.value)} value={project.studentRevision.audience} /><button onClick={() => rewriteOne("audience")} type="button">AI 只重写本项</button></label>
                  <label>生活问题<textarea onChange={(event) => reviseIntent("problem", event.target.value)} value={project.studentRevision.problem} /><button onClick={() => rewriteOne("problem")} type="button">AI 只重写本项</button></label>
                  <label>核心功能（用逗号分开）<input onChange={(event) => reviseIntent("coreFunctions", event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean))} value={project.studentRevision.coreFunctions.join("，")} /><button onClick={() => rewriteOne("coreFunctions")} type="button">AI 只重写本项</button></label>
                  <label>视觉风格<input onChange={(event) => reviseIntent("visualStyle", event.target.value)} value={project.studentRevision.visualStyle} /><button onClick={() => rewriteOne("visualStyle")} type="button">AI 只重写本项</button></label>
                </section>
              </div>
              <div className="intent-actions">
                <button onClick={() => reviseIntent("visualStyle", project.aiDraft!.visualStyle)} type="button">保留 AI 风格</button>
                <button onClick={() => reviseIntent("coreFunctions", [])} type="button">删除功能建议</button>
                <button onClick={() => reviseIntent("problem", `${project.studentRevision!.problem}；更具体地说，${studentNote || "由学生补充真实场景"}`)} type="button">只重写问题</button>
                <button onClick={() => {
                  const reason = window.prompt("为什么这样修改？") || "让结果更符合我的真实想法";
                  update({
                    finalIntent: project.studentRevision,
                    decisions: [...project.decisions, { id: `decision-intent-${Date.now()}`, lessonId: "lesson-01", toolId: "intent-canvas", title: "确认最终 App 意图", reason, suggestedBy: "student", createdAt: new Date().toISOString() }],
                  });
                }} type="button">确认最终版本</button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "prototype" && (
        <section className="prototype-editor">
          {!project.finalIntent ? <p>先在“AI意图编辑”中确认学生修改稿，网页原型只读取 finalIntent。</p> : (
            <div className="prototype-grid">
              <div className="tool-form">
                <label>App 名称<input onChange={(event) => update({ title: event.target.value })} value={project.title} /></label>
                <label>标题<input onChange={(event) => update({ finalIntent: { ...project.finalIntent!, appIntent: event.target.value } })} value={project.finalIntent.appIntent} /></label>
                <label>副标题<input onChange={(event) => update({ finalIntent: { ...project.finalIntent!, problem: event.target.value } })} value={project.finalIntent.problem} /></label>
                <label>主色<input onChange={(event) => update({ styles: { ...project.styles, tokens: { ...project.styles.tokens, accent: event.target.value } } })} type="color" value={project.styles.tokens.accent || "#7C3AED"} /></label>
                <label>辅助色<input onChange={(event) => update({ styles: { ...project.styles, tokens: { ...project.styles.tokens, surface: event.target.value } } })} type="color" value={project.styles.tokens.surface || "#FFFFFF"} /></label>
                <label>卡片样式<select onChange={(event) => update({ styles: { ...project.styles, tokens: { ...project.styles.tokens, card: event.target.value } } })} value={project.styles.tokens.card || "soft"}><option value="soft">柔和阴影</option><option value="outline">清晰描边</option><option value="flat">简洁平面</option></select></label>
                <label>按钮文字<input onChange={(event) => update({ components: [{ ...project.components[0], props: { ...project.components[0].props, label: event.target.value } }, ...project.components.slice(1)] })} value={String(project.components[0]?.props.label || "开始体验")} /></label>
                <button className="button button-primary" onClick={savePrototype} type="button">保存受控网页原型</button>
              </div>
              <div className="prototype-preview" style={{ "--accent": project.styles.tokens.accent, "--surface": project.styles.tokens.surface } as React.CSSProperties}>
                <small>{project.finalIntent.scenario}</small><h2>{project.finalIntent.appIntent}</h2><p>{project.finalIntent.problem}</p>
                <div>{project.finalIntent.coreFunctions.map((item) => <span key={item}>{item}</span>)}</div>
                <button type="button">{String(project.components[0]?.props.label || "开始体验")}</button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "test" && (
        <section className="unit-tests">
          {Object.entries(checks).map(([id, passed]) => <p className={passed ? "pass" : "fail"} key={id}>{passed ? "✓" : "×"} {id}</p>)}
          <p>刷新恢复：所有确认内容由统一 ProjectRepository 保存在当前项目键中。</p>
          <button onClick={() => {
            const now = new Date().toISOString();
            update({ tests: Object.entries(checks).map(([id, passed]) => ({ id: `lesson-01-${id}`, name: id, status: passed ? "pass" : "fail", projectRevision: project.revision, toolId: "intent-canvas", message: passed ? "检查通过" : "返回对应步骤修改后重试", attempts: (project.tests.find((item) => item.id === `lesson-01-${id}`)?.attempts ?? 0) + 1, updatedAt: now })) });
          }} type="button">运行并记录第1课试航</button>
        </section>
      )}
    </div>
  );
}
