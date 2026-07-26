"use client";
/* eslint-disable @next/next/no-img-element -- 学生可以为组件草图与图片卡导入本地 data URL。 */

import { useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  isSafeComponentType,
  SAFE_COMPONENT_TYPES,
  type SafeComponentType,
} from "@/lib/unit-two/creative-tools";
import { demoSafeComponentSuggestion } from "@/lib/ai/creative-ai-service";

type Panel = "museum" | "canvas" | "custom";

const componentInfo: Record<SafeComponentType, { name: string; problem: string; editable: string; apps: string; code: string }> = {
  "info-card": { name: "信息卡", problem: "把一组相关信息放在一起", editable: "标题、说明、颜色", apps: "学习提醒、活动介绍", code: "<article><h2>标题</h2><p>说明</p></article>" },
  "image-card": { name: "图片卡", problem: "用图片帮助用户快速理解", editable: "图片、标题、替代文字", apps: "兴趣介绍、作品展示", code: "<article><img /><h2>标题</h2></article>" },
  button: { name: "按钮", problem: "告诉用户可以触发一个动作", editable: "文字、颜色、禁用状态", apps: "所有需要操作的 App", code: "<button type=\"button\">开始</button>" },
  input: { name: "输入框", problem: "接收用户输入", editable: "提示、内容、错误状态", apps: "记录、搜索、问答", code: "<label>内容<input /></label>" },
  option: { name: "选项", problem: "让用户在有限范围内选择", editable: "标签、选中状态", apps: "问卷、推荐、设置", code: "<label><input type=\"radio\" />选项</label>" },
  list: { name: "列表", problem: "按顺序展示多条内容", editable: "条目、顺序、图标", apps: "任务、步骤、收藏", code: "<ul><li>第一项</li></ul>" },
  progress: { name: "进度条", problem: "显示任务完成到哪里", editable: "数值、颜色、标签", apps: "习惯打卡、课程进度", code: "<progress value=\"45\" max=\"100\" />" },
  alert: { name: "提示条", problem: "及时告诉用户状态变化", editable: "类型、文字、是否显示", apps: "表单、保存、错误提示", code: "<aside role=\"status\">保存成功</aside>" },
  "result-card": { name: "结果卡", problem: "集中展示一次操作的结果", editable: "结果、解释、下一步", apps: "测试、计算、推荐", code: "<section><output>结果</output></section>" },
  navigation: { name: "导航", problem: "在不同页面之间移动", editable: "页面、当前项、顺序", apps: "多页面 App", code: "<nav><a href=\"#\">首页</a></nav>" },
  modal: { name: "弹窗", problem: "在当前页面确认重要操作", editable: "标题、内容、开关", apps: "确认、帮助、详情", code: "<dialog open>确认内容</dialog>" },
};

export function ComponentStudio({
  project,
  onChange,
}: {
  project: ProjectDocument;
  onChange: (project: ProjectDocument) => void;
}) {
  const requestedPanel = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("panel");
  const [panel, setPanel] = useState<Panel>(requestedPanel === "canvas" || requestedPanel === "custom" ? requestedPanel : "museum");
  const [museumType, setMuseumType] = useState<SafeComponentType>("info-card");
  const [museumValue, setMuseumValue] = useState("");
  const [museumActive, setMuseumActive] = useState(false);
  const [selectedId, setSelectedId] = useState(project.components[0]?.id ?? "");
  const [briefName, setBriefName] = useState("");
  const [briefPurpose, setBriefPurpose] = useState("");
  const [briefSketch, setBriefSketch] = useState("");
  const [strokes, setStrokes] = useState<Array<{ id: string; points: Array<{ x: number; y: number }> }>>([]);
  const [activeStrokeId, setActiveStrokeId] = useState("");
  const [briefKeywords, setBriefKeywords] = useState("");
  const [annotations, setAnnotations] = useState<Array<{ id: string; kind: "input" | "button" | "result" | "note"; label: string }>>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const now = () => new Date().toISOString();
  const update = (changes: Partial<ProjectDocument>) => onChange({ ...project, ...changes });
  const selected = project.components.find((item) => item.id === selectedId);

  const addComponent = (type: SafeComponentType, pageId = project.pages[0]?.id) => {
    if (!pageId) return;
    const info = componentInfo[type];
    const id = `component-${type}-${Date.now()}`;
    setSelectedId(id);
    update({
      components: [...project.components, {
        id,
        pageId,
        type,
        name: info.name,
        props: {
          label: info.name,
          content: info.problem,
          image: "",
          variant: "default",
          order: project.components.filter((item) => item.pageId === pageId).length,
          accent: project.styleTokens.primary,
          active: false,
        },
      }],
    });
  };

  const changeComponent = (changes: Partial<ProjectDocument["components"][number]>) => {
    if (!selected) return;
    update({ components: project.components.map((item) => item.id === selected.id ? { ...item, ...changes } : item) });
  };

  const changeComponentProps = (
    componentId: string,
    props: ProjectDocument["components"][number]["props"],
  ) => {
    update({
      components: project.components.map((item) =>
        item.id === componentId ? { ...item, props } : item
      ),
    });
  };

  const move = (direction: -1 | 1) => {
    if (!selected) return;
    const pageComponents = project.components.filter((item) => item.pageId === selected.pageId);
    const index = pageComponents.findIndex((item) => item.id === selected.id);
    const other = pageComponents[index + direction];
    if (!other) return;
    const currentOrder = Number(selected.props.order) || index;
    const otherOrder = Number(other.props.order) || index + direction;
    update({ components: project.components.map((item) =>
      item.id === selected.id ? { ...item, props: { ...item.props, order: otherOrder } } :
        item.id === other.id ? { ...item, props: { ...item.props, order: currentOrder } } : item
    ) });
  };

  const createBrief = () => {
    const spec = demoSafeComponentSuggestion(briefName, briefPurpose, annotations);
    const timestamp = now();
    const id = `brief-${Date.now()}`;
    const brief: ProjectDocument["customComponentBriefs"][number] = {
      id,
      pageId: project.pages[0]?.id ?? "page-home",
      name: spec.name,
      purpose: spec.purpose,
      sketch: JSON.stringify({ strokes, note: briefSketch }),
      annotations,
      referenceImages,
      keywords: briefKeywords.split(/[,，、\s]+/).filter(Boolean),
      contentAreas: spec.contentAreas,
      editableProps: spec.editableProps,
      interactionNeeds: spec.interactionNeeds,
      safeComposition: spec.safeComposition,
      status: "draft",
    };
    update({
      customComponentBriefs: [...project.customComponentBriefs, brief],
      aiDrafts: [...project.aiDrafts, {
        id: `ai-component-${Date.now()}`,
        lessonId: "lesson-05",
        kind: "componentSpec",
        payload: JSON.stringify(brief),
        generatedAt: timestamp,
        disclaimer: "AI 只生成组件规格，由安全组件组合实现；不会执行任意生成代码。",
      }],
    });
  };

  const confirmBrief = (brief: ProjectDocument["customComponentBriefs"][number]) => {
    const timestamp = now();
    const safeTypes = brief.safeComposition.filter(isSafeComponentType);
    const components = safeTypes.map((type, index) => ({
      id: `component-safe-${brief.id}-${index}`,
      pageId: brief.pageId,
      type,
      name: `${brief.name} · ${componentInfo[type].name}`,
      props: {
        label: brief.contentAreas[index] ?? componentInfo[type].name,
        content: brief.purpose,
        order: project.components.length + index,
        accent: project.styleTokens.primary,
        safeBriefId: brief.id,
      },
    }));
    update({
      customComponentBriefs: project.customComponentBriefs.map((item) => item.id === brief.id ? { ...item, status: "confirmed" } : item),
      components: [...project.components, ...components],
      studentRevisions: [...project.studentRevisions, {
        id: `revision-component-${Date.now()}`,
        draftId: project.aiDrafts.filter((item) => item.kind === "componentSpec").at(-1)?.id ?? "student-only",
        lessonId: "lesson-05",
        kind: "componentSpec",
        payload: JSON.stringify(brief),
        reason: "学生修改规格后确认安全组件组合",
        confirmedAt: timestamp,
      }],
    });
    setPanel("canvas");
  };

  return (
    <div className="unit-two-studio">
      <nav className="tool-journey">
        <button aria-pressed={panel === "museum"} onClick={() => setPanel("museum")} type="button">1 组件实验馆</button>
        <button aria-pressed={panel === "canvas"} onClick={() => setPanel("canvas")} type="button">2 ComponentCanvas</button>
        <button aria-pressed={panel === "custom"} onClick={() => setPanel("custom")} type="button">3 自定义组件草图</button>
      </nav>

      {panel === "museum" && (
        <section className="component-museum">
          <div className="museum-shelves">{SAFE_COMPONENT_TYPES.map((type) => <button aria-pressed={museumType === type} key={type} onClick={() => { setMuseumType(type); setMuseumActive(false); }} type="button">{componentInfo[type].name}</button>)}</div>
          <div className="museum-exhibit">
            <div className="interactive-demo"><DemoComponent active={museumActive} onActive={setMuseumActive} onValue={setMuseumValue} type={museumType} value={museumValue} /></div>
            <article><h3>{componentInfo[museumType].name}</h3><p><b>解决什么问题：</b>{componentInfo[museumType].problem}</p><p><b>可以修改：</b>{componentInfo[museumType].editable}</p><p><b>适合哪些 App：</b>{componentInfo[museumType].apps}</p><pre>{componentInfo[museumType].code}</pre><button className="button button-primary" onClick={() => { addComponent(museumType); setPanel("canvas"); }} type="button">加入我的组件画布</button></article>
          </div>
        </section>
      )}

      {panel === "canvas" && (
        <section className="component-canvas">
          <div className="studio-toolbar">{SAFE_COMPONENT_TYPES.map((type) => <button key={type} onClick={() => addComponent(type)} type="button">+ {componentInfo[type].name}</button>)}</div>
          <div className="component-pages">
            {project.pages.map((page) => (
              <article key={page.id}><header><b>{page.name}</b></header>{project.components.filter((item) => item.pageId === page.id).sort((a, b) => Number(a.props.order) - Number(b.props.order)).map((item) => (
                <button className={selectedId === item.id ? "selected" : ""} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span>{item.name}</span><small>{String(item.props.label ?? "")}</small></button>
              ))}</article>
            ))}
          </div>
          {selected && <div className="component-editor">
            <label>内容<input onChange={(event) => changeComponent({ props: { ...selected.props, label: event.target.value } })} value={String(selected.props.label ?? "")} /></label>
            <label>属性/状态<select onChange={(event) => changeComponent({ props: { ...selected.props, variant: event.target.value } })} value={String(selected.props.variant ?? "default")}><option>default</option><option>active</option><option>disabled</option><option>success</option></select></label>
            <label>样式色<input onChange={(event) => changeComponent({ props: { ...selected.props, accent: event.target.value } })} type="color" value={String(selected.props.accent ?? project.styleTokens.primary)} /></label>
            <label>放入页面<select onChange={(event) => changeComponent({ pageId: event.target.value })} value={selected.pageId}>{project.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>
            <label className="upload-button">修改图片<input accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => changeComponent({ props: { ...selected.props, image: String(reader.result) } });
              reader.readAsDataURL(file);
            }} type="file" /></label>
            <button onClick={() => move(-1)} type="button">上移</button><button onClick={() => move(1)} type="button">下移</button>
            <button onClick={() => {
              const id = `component-copy-${Date.now()}`;
              update({ components: [...project.components, { ...selected, id, name: `${selected.name}副本`, props: { ...selected.props, order: Number(selected.props.order) + 1 } }] });
              setSelectedId(id);
            }} type="button">复制</button>
            <button onClick={() => update({ components: project.components.filter((item) => item.id !== selected.id) })} type="button">删除</button>
          </div>}
          <div className="safe-component-preview" data-safe-preview="controlled-react">
            <small>实时安全应用预览 · 只渲染注册组件</small>
            {project.pages.map((page) => <section key={page.id}><h3>{page.name}</h3>{project.components.filter((item) => item.pageId === page.id).slice(0, 12).map((item) => isSafeComponentType(item.type) ? <DemoComponent active={Boolean(item.props.active)} key={item.id} onActive={(active) => changeComponentProps(item.id, { ...item.props, active })} onValue={(value) => changeComponentProps(item.id, { ...item.props, label: value })} type={item.type} value={String(item.props.label ?? "")} /> : <article key={item.id}>{item.name}</article>)}</section>)}
          </div>
        </section>
      )}

      {panel === "custom" && (
        <section className="custom-component-brief">
          <div className="custom-sketch-board">
            <label>组件名称<input onChange={(event) => setBriefName(event.target.value)} value={briefName} /></label>
            <label>它需要完成什么<textarea onChange={(event) => setBriefPurpose(event.target.value)} value={briefPurpose} /></label>
            <svg
              aria-label="自定义组件绘图画板"
              className="custom-drawing-canvas"
              onPointerDown={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const id = `stroke-${Date.now()}`;
                event.currentTarget.setPointerCapture(event.pointerId);
                setActiveStrokeId(id);
                setStrokes((items) => [...items, { id, points: [{ x: event.clientX - bounds.left, y: event.clientY - bounds.top }] }]);
              }}
              onPointerMove={(event) => {
                if (!activeStrokeId) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                setStrokes((items) => items.map((stroke) => stroke.id === activeStrokeId ? { ...stroke, points: [...stroke.points, { x: event.clientX - bounds.left, y: event.clientY - bounds.top }] } : stroke));
              }}
              onPointerUp={() => setActiveStrokeId("")}
              role="img"
              viewBox="0 0 600 260"
            >
              <rect fill="#ffffff" height="260" rx="16" width="600" />
              {strokes.map((stroke) => <polyline fill="none" key={stroke.id} points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")} stroke="#6D28D9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />)}
              {strokes.length === 0 && <text fill="#64748B" fontSize="18" x="190" y="135">用鼠标或触控画出组件</text>}
            </svg>
            <button disabled={strokes.length === 0} onClick={() => setStrokes((items) => items.slice(0, -1))} type="button">撤销一笔</button>
            <label>画板/线条说明<textarea onChange={(event) => setBriefSketch(event.target.value)} placeholder="画出区域，并写下线条怎样连接" value={briefSketch} /></label>
            <div>{(["input", "button", "result", "note"] as const).map((kind) => <button key={kind} onClick={() => setAnnotations((items) => [...items, { id: `annotation-${Date.now()}`, kind, label: kind === "input" ? "用户输入" : kind === "button" ? "执行按钮" : kind === "result" ? "结果区域" : "说明便签" }])} type="button">+ 标注{kind}</button>)}</div>
            {annotations.map((annotation) => <label key={annotation.id}>{annotation.kind}<input onChange={(event) => setAnnotations((items) => items.map((item) => item.id === annotation.id ? { ...item, label: event.target.value } : item))} value={annotation.label} /></label>)}
            <label>关键词<input onChange={(event) => setBriefKeywords(event.target.value)} value={briefKeywords} /></label>
            <label className="upload-button">添加参考图片<input accept="image/*" multiple onChange={(event) => Array.from(event.target.files ?? []).forEach((file) => {
              const reader = new FileReader();
              reader.onload = () => setReferenceImages((images) => [...images, String(reader.result)]);
              reader.readAsDataURL(file);
            })} type="file" /></label>
            <div className="brief-images">{referenceImages.map((src, index) => <img alt={`参考 ${index + 1}`} key={`${src.slice(0, 30)}-${index}`} src={src} />)}</div>
            <button className="button button-primary" disabled={briefPurpose.trim().length < 4 || annotations.length === 0 || strokes.length === 0} onClick={createBrief} type="button">AI 转为安全组件规格草稿</button>
          </div>
          <div className="brief-results">
            {project.customComponentBriefs.map((brief) => <article key={brief.id}><label>名称<input onChange={(event) => update({ customComponentBriefs: project.customComponentBriefs.map((item) => item.id === brief.id ? { ...item, name: event.target.value, status: "student-revised" } : item) })} value={brief.name} /></label><label>作用<textarea onChange={(event) => update({ customComponentBriefs: project.customComponentBriefs.map((item) => item.id === brief.id ? { ...item, purpose: event.target.value, status: "student-revised" } : item) })} value={brief.purpose} /></label><p>内容区域：{brief.contentAreas.join("、")}</p><p>可修改属性：{brief.editableProps.join("、")}</p><p>互动需求：{brief.interactionNeeds.join("、")}</p><p>推荐安全组合：{brief.safeComposition.join(" + ")}</p><button disabled={brief.status === "confirmed"} onClick={() => confirmBrief(brief)} type="button">确认并用安全组件组合实现</button></article>)}
          </div>
        </section>
      )}
    </div>
  );
}

function DemoComponent({
  type,
  active,
  value,
  onActive,
  onValue,
}: {
  type: SafeComponentType;
  active: boolean;
  value: string;
  onActive: (active: boolean) => void;
  onValue: (value: string) => void;
}) {
  if (type === "button") return <button onClick={() => onActive(!active)} type="button">{active ? "已按下 ✓" : value || "点击我"}</button>;
  if (type === "input") return <input onChange={(event) => onValue(event.target.value)} placeholder="输入后观察反馈" value={value} />;
  if (type === "option") return <label><input checked={active} onChange={(event) => onActive(event.target.checked)} type="checkbox" />{active ? "已选择" : "选择一项"}</label>;
  if (type === "progress") return <progress max="100" value={active ? 80 : 35} />;
  if (type === "alert") return <button onClick={() => onActive(!active)} type="button">{active ? "保存成功！再次点击关闭" : "显示提示"}</button>;
  if (type === "modal") return <div><button onClick={() => onActive(!active)} type="button">打开弹窗</button>{active && <div role="dialog"><p>这是受控弹窗</p><button onClick={() => onActive(false)} type="button">关闭</button></div>}</div>;
  if (type === "navigation") return <nav><button aria-current={!active ? "page" : undefined} onClick={() => onActive(false)} type="button">首页</button><button aria-current={active ? "page" : undefined} onClick={() => onActive(true)} type="button">结果</button></nav>;
  if (type === "list") return <ul><li>第一步</li><li>第二步</li><li>{active ? "完成" : "待完成"}</li></ul>;
  if (type === "image-card") return <article><div>▧ 图片</div><b>{value || "图片卡标题"}</b><button onClick={() => onActive(!active)} type="button">{active ? "已收藏" : "收藏"}</button></article>;
  if (type === "result-card") return <article><output>{active ? "挑战完成：88 分" : "等待结果"}</output><button onClick={() => onActive(!active)} type="button">生成结果</button></article>;
  return <article><b>{value || "信息卡"}</b><p>{active ? "展开后的详细内容" : "点击查看详情"}</p><button onClick={() => onActive(!active)} type="button">{active ? "收起" : "展开"}</button></article>;
}
