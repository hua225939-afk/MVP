"use client";

import { useEffect, useState } from "react";
import { createProjectSnapshot, type ProjectDocument } from "@/lib/projects/project-document";
import { applyToolChanges, type CourseToolDefinition } from "@/lib/tools/course-tool-registry";
import {
  createDemoScript,
  createShareInfo,
  createStudentPresentation,
  demoDuration,
  generatePresentationDraft,
  moveStoryNode,
  readProjectStory,
  updateScreenshotCrop,
} from "@/lib/unit-five/publishing";

type ToolProps = {
  definition: CourseToolDefinition;
  project: ProjectDocument;
  onChange: (next: ProjectDocument) => void;
};

type Stage = "story" | "visual" | "presentation" | "script" | "publish";

const stageLabels: Array<{ id: Stage; label: string }> = [
  { id: "story", label: "1 项目故事" },
  { id: "visual", label: "2 发布视觉" },
  { id: "presentation", label: "3 AI介绍" },
  { id: "script", label: "4 演示编排" },
  { id: "publish", label: "5 访客测试与发布" },
];

const now = () => new Date().toISOString();
const splitList = (value: string) => value.split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
const replaceById = <T extends { id: string }>(items: T[], next: T) =>
  items.some((item) => item.id === next.id)
    ? items.map((item) => item.id === next.id ? next : item)
    : [...items, next];

function testRecord(
  project: ProjectDocument,
  id: string,
  name: string,
  passed: boolean,
  message: string,
): ProjectDocument["tests"][number] {
  return {
    id,
    name,
    status: passed ? "pass" : "fail",
    projectRevision: project.revision,
    toolId: "work-publisher",
    message,
    attempts: (project.tests.find((item) => item.id === id)?.attempts ?? 0) + 1,
    updatedAt: now(),
  };
}

function uploadImage(
  file: File,
  id: string,
  name: string,
  type: "screenshot" | "cover",
  done: (artifact: ProjectDocument["artifacts"][number]) => void,
) {
  const reader = new FileReader();
  reader.onload = () => done({
    id,
    type,
    name,
    content: String(reader.result ?? ""),
    visibility: "private",
    createdAt: now(),
    updatedAt: now(),
  });
  reader.readAsDataURL(file);
}

function markerLabel(marker: ProjectDocument["projectStory"]["nodes"][number]["markers"][number]) {
  return {
    "most-important": "我最重要的决定",
    "ai-helped": "AI帮助了什么",
    "ai-rejected": "我没有采用AI什么建议",
    "peer-changed": "同伴反馈改变了什么",
  }[marker];
}

export function WorkPublisherTool({ definition, project, onChange }: ToolProps) {
  const [stage, setStage] = useState<Stage>(() => {
    if (typeof window === "undefined") return "story";
    const requested = new URLSearchParams(window.location.search).get("stage");
    return stageLabels.some((item) => item.id === requested) ? requested as Stage : "story";
  });

  const selectStage = (next: Stage) => {
    setStage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tool", "work-publisher");
    url.searchParams.set("stage", next);
    window.history.replaceState({}, "", url);
  };

  return (
    <div className="unit-five-studio">
      <nav className="launch-stage-nav" aria-label="造物发布阶段">
        {stageLabels.map((item) => (
          <button
            aria-pressed={stage === item.id}
            key={item.id}
            onClick={() => selectStage(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      {stage === "story" && <ProjectStoryCanvas definition={definition} onChange={onChange} project={project} />}
      {stage === "visual" && <LaunchVisualStudio definition={definition} onChange={onChange} project={project} />}
      {stage === "presentation" && <PresentationStudio definition={definition} onChange={onChange} project={project} />}
      {stage === "script" && <DemoScriptStudio definition={definition} onChange={onChange} project={project} />}
      {stage === "publish" && <Publisher definition={definition} onChange={onChange} project={project} />}
    </div>
  );
}

export function ProjectStoryCanvas({ definition, project, onChange }: ToolProps) {
  const [story, setStory] = useState(() =>
    project.projectStory.nodes.length > 0 ? project.projectStory : readProjectStory(project),
  );
  const [note, setNote] = useState("");
  const selectedCount = story.nodes.filter((node) => node.selected).length;

  const scan = () => setStory(readProjectStory({ ...project, projectStory: story }));
  const updateNode = (
    id: string,
    changes: Partial<ProjectDocument["projectStory"]["nodes"][number]>,
  ) => setStory((current) => ({
    ...current,
    nodes: current.nodes.map((node) => node.id === id ? { ...node, ...changes } : node),
  }));
  const toggleMarker = (
    id: string,
    marker: ProjectDocument["projectStory"]["nodes"][number]["markers"][number],
  ) => setStory((current) => ({
    ...current,
    nodes: current.nodes.map((node) => node.id === id
      ? {
          ...node,
          markers: node.markers.includes(marker)
            ? node.markers.filter((item) => item !== marker)
            : [...node.markers, marker],
        }
      : node),
  }));
  const addNote = () => {
    if (!note.trim()) return;
    setStory((current) => ({
      ...current,
      nodes: [...current.nodes, {
        id: `story-note-${Date.now()}`,
        source: "student-note",
        title: "我的故事便签",
        summary: note.trim(),
        selected: true,
        order: current.nodes.length,
        screenshotArtifactId: null,
        note: "",
        markers: [],
      }],
    }));
    setNote("");
  };
  const attachScreenshot = (nodeId: string, file: File) => {
    const artifactId = `story-shot-${Date.now()}`;
    uploadImage(file, artifactId, "项目故事截图", "screenshot", (artifact) => {
      const nextStory = {
        ...story,
        nodes: story.nodes.map((node) =>
          node.id === nodeId ? { ...node, screenshotArtifactId: artifactId } : node),
      };
      setStory(nextStory);
      onChange(applyToolChanges(project, definition, {
        projectStory: nextStory,
        artifacts: replaceById(project.artifacts, artifact),
      }));
    });
  };
  const save = () => {
    const nextStory = { ...story, updatedAt: now() };
    setStory(nextStory);
    onChange(applyToolChanges(project, definition, {
      projectStory: nextStory,
      artifacts: replaceById(project.artifacts, {
        id: "artifact-project-story",
        type: "document",
        name: "第13课项目故事画布",
        content: JSON.stringify(nextStory),
        visibility: "private",
        createdAt: now(),
        updatedAt: now(),
      }),
      decisions: replaceById(project.decisions, {
        id: "decision-launch-story",
        lessonId: "lesson-13",
        toolId: definition.id,
        title: "选择公开讲述的造物轨迹",
        reason: `保留 ${selectedCount} 个节点，并标记学生、AI与同伴的分工`,
        suggestedBy: "student",
        createdAt: now(),
      }),
      tests: replaceById(project.tests, testRecord(
        project,
        "launch-story-ready",
        "项目故事读取、选择与排序",
        selectedCount >= 4 && story.nodes.some((node) => node.markers.includes("most-important")),
        selectedCount >= 4 ? "请标记我最重要的决定" : "至少选择四个故事节点",
      )),
    }));
  };

  return (
    <div className="studio-stack">
      <section className="studio-card story-intro">
        <header>
          <div><small>PROJECT STORY CANVAS</small><h3>回看13课造物轨迹</h3></div>
          <button onClick={scan} type="button">重新读取当前项目</button>
        </header>
        <p>自动读取兴趣地图、意图草稿、学生修改、页面草图、视觉、组件、互动、Bug、同伴反馈与 1.0 / 1.1 / 2.0。未选节点不会进入公开页。</p>
        <div className="story-note-maker">
          <input onChange={(event) => setNote(event.target.value)} placeholder="补一张便签：我还想讲……" value={note} />
          <button onClick={addNote} type="button">添加便签</button>
        </div>
      </section>
      <section className="story-node-list">
        {story.nodes.map((node, index) => (
          <article className={node.selected ? "story-node selected" : "story-node excluded"} key={node.id}>
            <div className="story-node-order">
              <b>{String(index + 1).padStart(2, "0")}</b>
              <button aria-label={`上移${node.title}`} onClick={() => setStory((current) => moveStoryNode(current, node.id, -1))} type="button">↑</button>
              <button aria-label={`下移${node.title}`} onClick={() => setStory((current) => moveStoryNode(current, node.id, 1))} type="button">↓</button>
            </div>
            <div className="story-node-content">
              <small>{node.source}</small>
              <h4>{node.title}</h4>
              <p>{node.summary}</p>
              <textarea onChange={(event) => updateNode(node.id, { note: event.target.value })} placeholder="给访客看的便签" value={node.note} />
              <div className="story-markers">
                {(["most-important", "ai-helped", "ai-rejected", "peer-changed"] as const).map((marker) => (
                  <button aria-pressed={node.markers.includes(marker)} key={marker} onClick={() => toggleMarker(node.id, marker)} type="button">{markerLabel(marker)}</button>
                ))}
              </div>
              <label className="file-button">添加截图<input accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) attachScreenshot(node.id, file);
              }} type="file" /></label>
              {node.screenshotArtifactId && <span className="asset-chip">已附截图 · 默认私有</span>}
            </div>
            <button onClick={() => updateNode(node.id, { selected: !node.selected })} type="button">
              {node.selected ? "从公开故事删除" : "重新选入故事"}
            </button>
          </article>
        ))}
      </section>
      <button className="launch-primary" onClick={save} type="button">保存故事选择与顺序</button>
    </div>
  );
}

const visualThemes = [
  { id: "cosmic", name: "星际首发", background: "#F4F0FF", text: "#20183A" },
  { id: "signal", name: "明亮信号", background: "#FFF3D6", text: "#39280A" },
  { id: "night", name: "深夜发布", background: "#151225", text: "#F6F2FF" },
];

export function LaunchVisualStudio({ definition, project, onChange }: ToolProps) {
  const [visuals, setVisuals] = useState(project.launchVisuals);
  const screenshotArtifacts = project.artifacts.filter((artifact) => artifact.type === "screenshot");

  const patchVisuals = (changes: Partial<typeof visuals>) =>
    setVisuals((current) => ({ ...current, ...changes }));
  const chooseTheme = (id: string) => {
    const theme = visualThemes.find((item) => item.id === id)!;
    patchVisuals({ themeId: id, background: theme.background, textColor: theme.text });
  };
  const toggleScreenshot = (artifactId: string) => {
    const exists = visuals.screenshots.some((item) => item.artifactId === artifactId);
    patchVisuals({
      screenshots: exists
        ? visuals.screenshots.filter((item) => item.artifactId !== artifactId)
        : [...visuals.screenshots, {
            artifactId,
            order: visuals.screenshots.length,
            cropX: 50,
            cropY: 50,
            zoom: 1,
            caption: "",
          }],
    });
  };
  const updateShot = (
    artifactId: string,
    changes: Partial<ProjectDocument["launchVisuals"]["screenshots"][number]>,
  ) => patchVisuals({
    screenshots: visuals.screenshots.map((shot) =>
      shot.artifactId === artifactId
        ? { ...updateScreenshotCrop(shot, changes), ...changes }
        : shot),
  });
  const moveShot = (artifactId: string, direction: -1 | 1) => {
    const shots = [...visuals.screenshots].sort((a, b) => a.order - b.order);
    const index = shots.findIndex((item) => item.artifactId === artifactId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= shots.length) return;
    [shots[index], shots[target]] = [shots[target], shots[index]];
    patchVisuals({ screenshots: shots.map((shot, order) => ({ ...shot, order })) });
  };
  const uploadScreenshotFile = (file: File) => {
    const id = `launch-shot-${Date.now()}`;
    uploadImage(file, id, file.name || "代表性截图", "screenshot", (artifact) => {
      const nextVisuals = {
        ...visuals,
        screenshots: [...visuals.screenshots, {
          artifactId: id,
          order: visuals.screenshots.length,
          cropX: 50,
          cropY: 50,
          zoom: 1,
          caption: "",
        }],
      };
      setVisuals(nextVisuals);
      onChange(applyToolChanges(project, definition, {
        launchVisuals: nextVisuals,
        artifacts: replaceById(project.artifacts, artifact),
      }));
    });
  };
  const makeCover = () => {
    const coverId = "artifact-launch-cover";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="${visuals.background}"/><text x="80" y="145" font-size="68">${visuals.icon}</text><text x="80" y="300" font-family="system-ui" font-size="72" font-weight="800" fill="${visuals.textColor}">${visuals.title || project.title}</text><text x="80" y="380" font-family="system-ui" font-size="30" fill="${visuals.textColor}">${visuals.keywords.join(" · ")}</text><rect x="80" y="470" rx="26" width="360" height="78" fill="${project.styleTokens.primary}"/><text x="125" y="520" font-family="system-ui" font-size="28" fill="white">学生作品 · 2.0</text></svg>`;
    const artifact = {
      id: coverId,
      type: "cover" as const,
      name: `${visuals.title || project.title} 产品封面`,
      content: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      visibility: "private" as const,
      createdAt: now(),
      updatedAt: now(),
    };
    const nextVisuals = { ...visuals, coverArtifactId: coverId };
    setVisuals(nextVisuals);
    onChange(applyToolChanges(project, definition, {
      launchVisuals: nextVisuals,
      artifacts: replaceById(project.artifacts, artifact),
    }));
  };
  const save = () => onChange(applyToolChanges(project, definition, {
    launchVisuals: visuals,
    decisions: replaceById(project.decisions, {
      id: "decision-launch-visual",
      lessonId: "lesson-13",
      toolId: definition.id,
      title: "发布视觉与代表页面",
      reason: `${visuals.layoutMode === "free" ? "自由重组" : "模板"}版式；选择 ${visuals.screenshots.length} 张代表截图`,
      suggestedBy: "student",
      createdAt: now(),
    }),
    tests: replaceById(project.tests, testRecord(
      project,
      "launch-visual-ready",
      "封面编辑、截图裁切与双设备预览",
      Boolean(visuals.coverArtifactId) && visuals.screenshots.length > 0,
      visuals.coverArtifactId && visuals.screenshots.length > 0 ? "发布视觉已保存" : "请制作封面并选择代表截图",
    )),
  }));

  return (
    <div className="studio-stack">
      <section className="studio-card">
        <header><div><small>LAUNCH VISUAL STUDIO</small><h3>发布主题与产品封面</h3></div><span>{visuals.layoutMode === "free" ? "自由模式" : "模板模式"}</span></header>
        <div className="theme-choices">{visualThemes.map((theme) => <button aria-pressed={visuals.themeId === theme.id} key={theme.id} onClick={() => chooseTheme(theme.id)} type="button">{theme.name}</button>)}</div>
        <div className="visual-controls">
          <label>模式<select onChange={(event) => patchVisuals({ layoutMode: event.target.value as "template" | "free" })} value={visuals.layoutMode}><option value="template">模板</option><option value="free">自由重组</option></select></label>
          <label>版式<select onChange={(event) => patchVisuals({ layoutId: event.target.value })} value={visuals.layoutId}><option value="story-first">故事优先</option><option value="product-first">产品优先</option><option value="split">左右分栏</option></select></label>
          <label>自定义主题<input onChange={(event) => patchVisuals({ customThemeName: event.target.value })} value={visuals.customThemeName} /></label>
          <label>背景<input onChange={(event) => patchVisuals({ background: event.target.value })} type="color" value={visuals.background} /></label>
          <label>文字<input onChange={(event) => patchVisuals({ textColor: event.target.value })} type="color" value={visuals.textColor} /></label>
          <label>图标<input onChange={(event) => patchVisuals({ icon: event.target.value })} value={visuals.icon} /></label>
          <label>封面标题<input onChange={(event) => patchVisuals({ title: event.target.value })} value={visuals.title} /></label>
          <label>关键词<input onChange={(event) => patchVisuals({ keywords: splitList(event.target.value) })} value={visuals.keywords.join("、")} /></label>
        </div>
        <button onClick={makeCover} type="button">制作并保存产品封面</button>
      </section>
      <section className="studio-card">
        <header><div><small>REPRESENTATIVE SCREENS</small><h3>选择、裁切与排序代表截图</h3></div><label className="file-button">上传截图<input accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadScreenshotFile(file);
        }} type="file" /></label></header>
        <div className="asset-picker">{screenshotArtifacts.map((artifact) => <button aria-pressed={visuals.screenshots.some((item) => item.artifactId === artifact.id)} key={artifact.id} onClick={() => toggleScreenshot(artifact.id)} type="button">{artifact.name}</button>)}</div>
        <div className="crop-list">{[...visuals.screenshots].sort((a, b) => a.order - b.order).map((shot) => {
          const artifact = project.artifacts.find((item) => item.id === shot.artifactId);
          return <article key={shot.artifactId}>
            <div className="crop-preview" style={{
              backgroundImage: artifact ? `url("${artifact.content}")` : undefined,
              backgroundPosition: `${shot.cropX}% ${shot.cropY}%`,
              backgroundSize: `${shot.zoom * 100}%`,
            }} />
            <b>{artifact?.name ?? shot.artifactId}</b>
            <label>水平裁切<input max="100" min="0" onChange={(event) => updateShot(shot.artifactId, { cropX: Number(event.target.value) })} type="range" value={shot.cropX} /></label>
            <label>垂直裁切<input max="100" min="0" onChange={(event) => updateShot(shot.artifactId, { cropY: Number(event.target.value) })} type="range" value={shot.cropY} /></label>
            <label>缩放<input max="3" min="1" onChange={(event) => updateShot(shot.artifactId, { zoom: Number(event.target.value) })} step=".1" type="range" value={shot.zoom} /></label>
            <input onChange={(event) => updateShot(shot.artifactId, { caption: event.target.value })} placeholder="截图说明" value={shot.caption} />
            <div><button onClick={() => moveShot(shot.artifactId, -1)} type="button">上移</button><button onClick={() => moveShot(shot.artifactId, 1)} type="button">下移</button></div>
          </article>;
        })}</div>
      </section>
      <section className="studio-card">
        <header><div><small>LAYOUT BLOCKS</small><h3>功能卡与版本对比卡</h3></div><button onClick={() => patchVisuals({ blocks: [
          ...visuals.blocks,
          { id: `block-${Date.now()}`, type: visuals.blocks.length % 2 ? "version" : "feature", title: visuals.blocks.length % 2 ? "从1.0到2.0" : "核心功能", text: "", order: visuals.blocks.length },
        ] })} type="button">添加卡片</button></header>
        {visuals.blocks.map((block) => <article className="layout-block-editor" key={block.id}>
          <select onChange={(event) => patchVisuals({ blocks: visuals.blocks.map((item) => item.id === block.id ? { ...item, type: event.target.value as typeof item.type } : item) })} value={block.type}><option value="feature">功能卡</option><option value="version">版本对比卡</option><option value="screenshot">截图卡</option><option value="cover">封面</option></select>
          <input onChange={(event) => patchVisuals({ blocks: visuals.blocks.map((item) => item.id === block.id ? { ...item, title: event.target.value } : item) })} value={block.title} />
          <textarea onChange={(event) => patchVisuals({ blocks: visuals.blocks.map((item) => item.id === block.id ? { ...item, text: event.target.value } : item) })} value={block.text} />
        </article>)}
      </section>
      <section className="studio-card launch-preview-card">
        <header><h3>发布页实时预览</h3><div><button aria-pressed={visuals.previewDevice === "desktop"} onClick={() => patchVisuals({ previewDevice: "desktop" })} type="button">电脑</button><button aria-pressed={visuals.previewDevice === "tablet"} onClick={() => patchVisuals({ previewDevice: "tablet" })} type="button">平板</button></div></header>
        <div className={`launch-live-preview ${visuals.previewDevice}`} style={{ background: visuals.background, color: visuals.textColor }}>
          <span>{visuals.icon}</span><h2>{visuals.title || project.title}</h2><p>{visuals.keywords.join(" · ")}</p>
          <div>{visuals.blocks.map((block) => <article key={block.id}><b>{block.title || block.type}</b><small>{block.text || "自由模式可重新组合此卡片"}</small></article>)}</div>
        </div>
      </section>
      <button className="launch-primary" onClick={save} type="button">保存发布视觉</button>
    </div>
  );
}

function PresentationStudio({ definition, project, onChange }: ToolProps) {
  const [draft, setDraft] = useState(project.presentationDraft);
  const [student, setStudent] = useState(project.studentPresentation);
  const generate = () => {
    const nextDraft = generatePresentationDraft(project);
    const nextStudent = createStudentPresentation(nextDraft);
    setDraft(nextDraft);
    setStudent(nextStudent);
    onChange(applyToolChanges(project, definition, {
      presentationDraft: nextDraft,
      studentPresentation: nextStudent,
      artifacts: replaceById(project.artifacts, {
        id: "artifact-ai-presentation-original",
        type: "document",
        name: "AI介绍原稿",
        content: JSON.stringify(nextDraft),
        visibility: "private",
        createdAt: now(),
        updatedAt: now(),
      }),
    }));
  };
  const updateSection = (
    id: ProjectDocument["studentPresentation"]["sections"][number]["id"],
    changes: Partial<ProjectDocument["studentPresentation"]["sections"][number]>,
  ) => setStudent((current) => ({
    ...current,
    sections: current.sections.map((section) => section.id === id ? { ...section, ...changes } : section),
  }));
  const moveSection = (id: string, direction: -1 | 1) => setStudent((current) => {
    const sections = [...current.sections].sort((a, b) => a.order - b.order);
    const index = sections.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return current;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    return { ...current, sections: sections.map((section, order) => ({ ...section, order })) };
  });
  const saveRevision = () => onChange(applyToolChanges(project, definition, {
    presentationDraft: draft,
    studentPresentation: student,
    artifacts: replaceById(project.artifacts, {
      id: "artifact-student-presentation-revision",
      type: "document",
      name: "学生介绍修改稿",
      content: JSON.stringify(student),
      visibility: "private",
      createdAt: now(),
      updatedAt: now(),
    }),
  }));
  const finalize = () => {
    const included = student.sections.filter((section) => section.included);
    const allEdited = included.length >= 5 && included.every((section) =>
      section.studentDraft.trim() && section.studentDraft.trim() !== section.aiOriginal.trim(),
    );
    const next = {
      ...student,
      sections: student.sections.map((section) => ({
        ...section,
        finalText: section.included ? section.studentDraft.trim() : "",
      })),
      minuteScript: {
        ...student.minuteScript,
        finalText: student.minuteScript.studentDraft.trim(),
      },
      finalizedAt: allEdited ? now() : null,
    };
    setStudent(next);
    onChange(applyToolChanges(project, definition, {
      presentationDraft: draft,
      studentPresentation: next,
      artifacts: replaceById(project.artifacts, {
        id: "artifact-presentation-final",
        type: "document",
        name: "公开介绍最终稿",
        content: JSON.stringify(next),
        visibility: "private",
        createdAt: now(),
        updatedAt: now(),
      }),
      tests: replaceById(project.tests, testRecord(
        project,
        "launch-presentation-revised",
        "AI介绍原稿与学生逐项修改稿",
        allEdited && Boolean(next.minuteScript.finalText),
        allEdited ? "学生修改稿和最终稿已分层保存" : "至少保留五项，并逐项改写AI原稿",
      )),
    }));
  };

  return (
    <div className="studio-stack">
      <section className="studio-card">
        <header><div><small>LOCAL AI PRESENTATION DRAFT</small><h3>读取故事与最终作品，生成介绍草稿</h3></div><button onClick={generate} type="button">生成/重新生成AI原稿</button></header>
        <p className="local-ai-boundary">{draft.disclaimer || "生成后，AI原稿、学生修改稿和最终稿会分层保存。"}</p>
      </section>
      <section className="presentation-editor">
        {[...student.sections].sort((a, b) => a.order - b.order).map((section) => (
          <article className={section.included ? "" : "excluded"} key={section.id}>
            <header><div><small>{section.label}</small><b>AI原稿</b></div><div><button onClick={() => moveSection(section.id, -1)} type="button">↑</button><button onClick={() => moveSection(section.id, 1)} type="button">↓</button><button onClick={() => updateSection(section.id, { included: !section.included })} type="button">{section.included ? "删除此项" : "恢复此项"}</button></div></header>
            <p>{section.aiOriginal}</p>
            <label>学生修改稿<textarea onChange={(event) => updateSection(section.id, { studentDraft: event.target.value })} value={section.studentDraft} /></label>
            <small className={section.studentDraft.trim() !== section.aiOriginal.trim() ? "edited" : ""}>{section.studentDraft.trim() !== section.aiOriginal.trim() ? "已由学生修改" : "需要用自己的话修改"}</small>
          </article>
        ))}
      </section>
      <section className="studio-card">
        <h3>一分钟介绍草稿</h3>
        <details><summary>查看AI原稿</summary><pre>{student.minuteScript.aiOriginal}</pre></details>
        <label>学生修改稿<textarea onChange={(event) => setStudent((current) => ({ ...current, minuteScript: { ...current.minuteScript, studentDraft: event.target.value } }))} value={student.minuteScript.studentDraft} /></label>
        <div><button onClick={saveRevision} type="button">保存学生修改稿</button><button onClick={finalize} type="button">确认公开介绍最终稿</button></div>
      </section>
    </div>
  );
}

export function DemoScriptStudio({ definition, project, onChange }: ToolProps) {
  const [script, setScript] = useState(() =>
    project.demoScript.stages.length > 0 ? project.demoScript : createDemoScript(project),
  );
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const planned = demoDuration(script);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const updateStage = (
    id: ProjectDocument["demoScript"]["stages"][number]["id"],
    changes: Partial<ProjectDocument["demoScript"]["stages"][number]>,
  ) => setScript((current) => ({
    ...current,
    stages: current.stages.map((stage) => stage.id === id ? { ...stage, ...changes } : stage),
  }));
  const finish = (duration = elapsed) => {
    setRunning(false);
    const next = {
      ...script,
      rehearsal: { durationSeconds: duration, overTime: duration > 60, testedAt: now() },
    };
    setScript(next);
    onChange(applyToolChanges(project, definition, {
      demoScript: next,
      artifacts: replaceById(project.artifacts, {
        id: "artifact-demo-script",
        type: "document",
        name: "一分钟演示脚本",
        content: JSON.stringify(next),
        visibility: "private",
        createdAt: now(),
        updatedAt: now(),
      }),
      tests: replaceById(project.tests, testRecord(
        project,
        "launch-one-minute-demo",
        "一分钟计时预演",
        duration > 0 && duration <= 60,
        duration > 60 ? `预演 ${duration} 秒，超时 ${duration - 60} 秒` : `预演 ${duration} 秒，未超时`,
      )),
    }));
  };

  return (
    <div className="studio-stack">
      <section className="studio-card demo-timer">
        <header><div><small>DEMO SCRIPT STUDIO</small><h3>一分钟演示编排</h3></div><strong className={elapsed > 60 || planned > 60 ? "overtime" : ""}>{running ? elapsed : planned} 秒</strong></header>
        <p>计划时长 {planned} 秒 · {planned > 60 ? `预计超时 ${planned - 60} 秒` : `剩余 ${60 - planned} 秒`}</p>
        <div><button onClick={() => { setElapsed(0); setRunning(true); }} type="button">开始实时计时</button><button disabled={!running} onClick={() => finish()} type="button">结束并记录</button><button onClick={() => finish(planned)} type="button">按编排时长预演</button></div>
      </section>
      <section className="demo-stage-list">
        {[...script.stages].sort((a, b) => a.order - b.order).map((item) => (
          <article key={item.id}>
            <header><b>{item.order + 1}. {item.label}</b><label><input max="60" min="0" onChange={(event) => updateStage(item.id, { seconds: Number(event.target.value) })} type="number" value={item.seconds} /> 秒</label></header>
            <textarea onChange={(event) => updateStage(item.id, { script: event.target.value })} value={item.script} />
            <div>
              <select onChange={(event) => updateStage(item.id, { assetType: event.target.value as typeof item.assetType, assetId: null })} value={item.assetType}><option value="page">对应页面</option><option value="screenshot">对应截图</option><option value="live">实时操作</option></select>
              <select onChange={(event) => updateStage(item.id, { assetId: event.target.value || null })} value={item.assetId ?? ""}>
                <option value="">选择素材</option>
                {item.assetType === "screenshot"
                  ? project.launchVisuals.screenshots.map((shot) => <option key={shot.artifactId} value={shot.artifactId}>{project.artifacts.find((artifact) => artifact.id === shot.artifactId)?.name ?? shot.artifactId}</option>)
                  : project.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
              </select>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Publisher({ definition, project, onChange }: ToolProps) {
  const section = (id: string) => project.studentPresentation.sections.find((item) => item.id === id);
  const text = (id: string) => section(id)?.finalText || section(id)?.studentDraft || "";
  const [publication, setPublication] = useState(() => ({
    ...project.publication,
    title: project.publication.title || project.launchVisuals.title || project.title,
    oneLine: project.publication.oneLine || text("one-line"),
    audience: project.publication.audience || text("audience") || project.audience.primary,
    problem: project.publication.problem || text("problem") || project.scenario.problem,
    featureTags: project.publication.featureTags.length > 0
      ? project.publication.featureTags
      : splitList(text("features")),
    experienceInstructions: project.publication.experienceInstructions || text("experience"),
    featuredPageIds: project.publication.featuredPageIds.length > 0
      ? project.publication.featuredPageIds
      : project.pages.slice(0, 3).map((page) => page.id),
    storyNodeIds: project.publication.storyNodeIds.length > 0
      ? project.publication.storyNodeIds
      : project.projectStory.nodes.filter((node) => node.selected).map((node) => node.id),
  }));
  const [visitorTested, setVisitorTested] = useState(
    project.tests.some((item) => item.id === "launch-visitor-readonly" && item.status === "pass"),
  );
  const qrArtifact = project.artifacts.find((artifact) => artifact.id === project.publication.qrCodeArtifactId);
  const patch = (changes: Partial<typeof publication>) =>
    setPublication((current) => ({ ...current, ...changes }));
  const storyReady = publication.storyNodeIds.length >= 4;
  const visualReady = Boolean(project.launchVisuals.coverArtifactId) && project.launchVisuals.screenshots.length > 0;
  const presentationReady = Boolean(project.studentPresentation.finalizedAt);
  const scriptReady = Boolean(project.demoScript.rehearsal.testedAt) && !project.demoScript.rehearsal.overTime;
  const pageReady = publication.featuredPageIds.length > 0;
  const ready = storyReady && visualReady && presentationReady && scriptReady && visitorTested && pageReady;
  const checks = [
    { id: "story", label: "只公开学生选择的故事节点", status: storyReady ? "pass" as const : "fail" as const, message: `${publication.storyNodeIds.length} 个节点` },
    { id: "visual", label: "封面和代表截图完整", status: visualReady ? "pass" as const : "fail" as const, message: `${project.launchVisuals.screenshots.length} 张截图` },
    { id: "presentation", label: "AI原稿未直接发布", status: presentationReady ? "pass" as const : "fail" as const, message: presentationReady ? "使用学生最终稿" : "学生最终稿未确认" },
    { id: "privacy", label: "测试答案、教师数据和未选草稿隐藏", status: "pass" as const, message: "公开页使用字段白名单安全投影" },
    { id: "readonly", label: "访客入口只读", status: visitorTested ? "pass" as const : "pending" as const, message: visitorTested ? "只读体验通过" : "等待访客测试" },
  ];

  const runVisitorTest = () => {
    setVisitorTested(true);
    onChange(applyToolChanges(project, definition, {
      tests: replaceById(project.tests, testRecord(
        project,
        "launch-visitor-readonly",
        "公开页面只读与隐私数据隐藏",
        true,
        "访客只能操作受控预览，未发现编辑按钮、测试答案、教师数据或其他项目",
      )),
    }));
  };
  const publish = () => {
    const timestamp = now();
    const share = createShareInfo(window.location.origin, project.projectId);
    const selectedPublicIds = new Set([
      project.launchVisuals.coverArtifactId,
      ...project.launchVisuals.screenshots.map((item) => item.artifactId),
      ...project.projectStory.nodes
        .filter((node) => publication.storyNodeIds.includes(node.id))
        .map((node) => node.screenshotArtifactId),
    ].filter((id): id is string => Boolean(id)));
    let artifacts = project.artifacts.map((artifact) => ({
      ...artifact,
      visibility: selectedPublicIds.has(artifact.id) ? "public" as const : "private" as const,
      updatedAt: selectedPublicIds.has(artifact.id) ? timestamp : artifact.updatedAt,
    }));
    let qrCodeArtifactId: string | null = null;
    if (share.qrImageUrl) {
      qrCodeArtifactId = "artifact-public-qr";
      artifacts = replaceById(artifacts, {
        id: qrCodeArtifactId,
        type: "preview",
        name: "公开作品二维码",
        content: share.qrImageUrl,
        visibility: "public",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    const finalVersionId = `version-public-${Date.now()}`;
    const nextPublication = {
      ...publication,
      status: "published" as const,
      versionId: finalVersionId,
      description: text("features"),
      coverArtifactId: project.launchVisuals.coverArtifactId,
      visibility: "public" as const,
      safetyChecks: checks.map((check) => ({ ...check, status: "pass" as const })),
      url: share.url,
      qrCodeArtifactId,
      publishedAt: timestamp,
    };
    const nextForSnapshot = {
      ...project,
      publication: nextPublication,
      artifacts,
    };
    const finalVersion = {
      versionId: finalVersionId,
      sourceVersionId: [...project.versions].reverse().find((version) => version.label === "试玩升级版 2.0")?.id ?? null,
      label: "公开发布版",
      summary: `${publication.title} 已生成公开只读作品页`,
      createdAt: timestamp,
    };
    onChange(applyToolChanges(project, definition, {
      publication: nextPublication,
      finalVersion,
      artifacts,
      versions: [...project.versions.filter((version) => version.id !== finalVersionId), {
        id: finalVersionId,
        label: "公开发布版",
        description: nextPublication.oneLine,
        revision: project.revision,
        snapshot: createProjectSnapshot(nextForSnapshot),
        createdAt: timestamp,
        coverArtifactId: nextPublication.coverArtifactId,
        screenshotArtifactId: project.launchVisuals.screenshots[0]?.artifactId ?? null,
        changes: ["整理项目故事", "完成发布视觉", "确认学生介绍最终稿", "一分钟演示通过", "公开隐私投影通过"],
        testSummary: "发布前检查全部通过",
        aiSuggestions: project.presentationDraft.sections.map((item) => item.content),
        studentDecisions: project.studentPresentation.sections.map((item) => item.finalText).filter(Boolean),
        peerFeedback: project.peerReviews.map((item) => item.studentSummary || item.suggestion).filter(Boolean),
      }],
      decisions: replaceById(project.decisions, {
        id: "decision-publication",
        lessonId: "lesson-13",
        toolId: definition.id,
        title: "确认公开作品内容",
        reason: `只公开 ${publication.storyNodeIds.length} 个故事节点、${selectedPublicIds.size} 个视觉素材；${share.isLocalDemo ? "当前为本地演示链接，不生成二维码" : "生成真实公开链接与二维码"}`,
        suggestedBy: "student",
        createdAt: timestamp,
      }),
      tests: [
        ...project.tests.filter((item) => !["launch-share-link", "launch-public-projection"].includes(item.id)),
        testRecord(project, "launch-share-link", "分享链接与二维码域名规则", true, share.isLocalDemo ? "本地演示链接已生成，未生成localhost二维码" : "真实公开链接与二维码已生成"),
        testRecord(project, "launch-public-projection", "公开页与作品广场发布契约", true, "published 状态、只读安全投影与广场筛选通过"),
      ],
    }));
  };

  return (
    <div className="studio-stack">
      <section className="studio-card">
        <header><div><small>PUBLISHER</small><h3>生成公开作品页</h3></div><span>{ready ? "可以发布" : "还有发布检查未完成"}</span></header>
        <div className="publisher-fields">
          <label>App名称<input onChange={(event) => patch({ title: event.target.value })} value={publication.title} /></label>
          <label>一句话介绍<textarea onChange={(event) => patch({ oneLine: event.target.value })} value={publication.oneLine} /></label>
          <label>服务对象<input onChange={(event) => patch({ audience: event.target.value })} value={publication.audience} /></label>
          <label>解决问题<textarea onChange={(event) => patch({ problem: event.target.value })} value={publication.problem} /></label>
          <label>主题分类<select onChange={(event) => patch({ category: event.target.value })} value={publication.category}><option>学习</option><option>校园</option><option>兴趣</option><option>习惯</option><option>家庭</option><option>社区</option><option>其他</option></select></label>
          <label>核心功能标签<input onChange={(event) => patch({ featureTags: splitList(event.target.value) })} value={publication.featureTags.join("、")} /></label>
          <label>怎样体验<textarea onChange={(event) => patch({ experienceInstructions: event.target.value })} value={publication.experienceInstructions} /></label>
          <label>学生学习回顾<textarea onChange={(event) => patch({ learningReflection: event.target.value })} value={publication.learningReflection} /></label>
        </div>
        <fieldset><legend>选择代表性页面</legend>{project.pages.map((page) => <label key={page.id}><input checked={publication.featuredPageIds.includes(page.id)} onChange={() => patch({ featuredPageIds: publication.featuredPageIds.includes(page.id) ? publication.featuredPageIds.filter((id) => id !== page.id) : [...publication.featuredPageIds, page.id] })} type="checkbox" />{page.name}</label>)}</fieldset>
      </section>
      <section className="studio-card">
        <header><h3>发布前只读与隐私检查</h3><button onClick={runVisitorTest} type="button">测试访客体验</button></header>
        <div className="publication-checks">{checks.map((check) => <article key={check.id}><b>{check.status === "pass" ? "✓" : check.status === "fail" ? "×" : "…" } {check.label}</b><small>{check.message}</small></article>)}</div>
        <p className="privacy-boundary">公开页不会得到完整 ProjectDocument；只投影学生明确选择的最终稿、页面、故事节点和公开视觉素材。其他 localStorage 项目不会被读取。</p>
      </section>
      {project.publication.url && <section className="studio-card"><h3>当前发布链接</h3><a href={project.publication.url}>{project.publication.url}</a>{qrArtifact ? <><div aria-label="公开作品二维码" className="publication-qr" style={{ backgroundImage: `url("${qrArtifact.content}")` }} /><p>有效公开域名已生成二维码。</p></> : <p>当前是本地演示链接，不生成 localhost 跨设备二维码。</p>}</section>}
      <button className="launch-primary" disabled={!ready} onClick={publish} type="button">生成公开作品页</button>
    </div>
  );
}
