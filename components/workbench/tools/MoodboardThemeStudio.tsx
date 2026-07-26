"use client";
/* eslint-disable @next/next/no-img-element -- 情绪板需要展示本地参考图与学生上传的 data URL。 */

import { useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  contrastRatio,
  styleTokensToCss,
} from "@/lib/unit-two/creative-tools";
import { demoStyleTokenSuggestion } from "@/lib/ai/creative-ai-service";

type Panel = "moodboard" | "theme";
const tokenConfirmations = [
  "主色", "辅助色", "背景色", "文字色", "字体建议", "字号层级",
  "间距", "圆角", "阴影", "按钮样式", "边框", "页面宽度",
] as const;

const localReferences = [
  { id: "neon", title: "霓虹运动场", imageData: "/unit-two/neon-court.svg", colors: ["#6D28D9", "#22D3EE", "#F8FAFC"] },
  { id: "nature", title: "雨后自然笔记", imageData: "/unit-two/nature-notes.svg", colors: ["#166534", "#84CC16", "#FEFCE8"] },
  { id: "maker", title: "少年创客桌", imageData: "/unit-two/maker-desk.svg", colors: ["#EA580C", "#2563EB", "#FFF7ED"] },
  { id: "calm", title: "安静阅读角", imageData: "/unit-two/reading-corner.svg", colors: ["#334155", "#C084FC", "#F8FAFC"] },
];

async function extractImageColors(imageData: string) {
  const image = new Image();
  image.src = imageData;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return ["#7C3AED", "#2563EB", "#F8FAFC"];
  context.drawImage(image, 0, 0, 24, 24);
  const pixels = context.getImageData(0, 0, 24, 24).data;
  const buckets = new Map<string, number>();
  for (let index = 0; index < pixels.length; index += 32) {
    if (pixels[index + 3] < 160) continue;
    const channels = [pixels[index], pixels[index + 1], pixels[index + 2]]
      .map((value) => Math.round(value / 32) * 32);
    const hex = `#${channels.map((value) => Math.min(255, value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    buckets.set(hex, (buckets.get(hex) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);
}

export function MoodboardThemeStudio({
  project,
  onChange,
}: {
  project: ProjectDocument;
  onChange: (project: ProjectDocument) => void;
}) {
  const requestedPanel = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("panel");
  const [panel, setPanel] = useState<Panel>(requestedPanel === "theme" ? "theme" : "moodboard");
  const [previousTokens, setPreviousTokens] = useState(project.styleTokens);
  const [beforeTokens, setBeforeTokens] = useState(project.styleTokens);
  const [keyword, setKeyword] = useState("");
  const [confirmedTokens, setConfirmedTokens] = useState<string[]>([]);
  const now = () => new Date().toISOString();
  const update = (changes: Partial<ProjectDocument>) => onChange({ ...project, ...changes });
  const items = project.moodboard.items.length
    ? project.moodboard.items
    : localReferences.map((item) => ({ ...item, source: "local" as const, favorite: false, selected: false }));

  const changeMoodboard = (changes: Partial<ProjectDocument["moodboard"]>) => {
    update({ moodboard: { ...project.moodboard, items, ...changes } });
  };

  const changeTokens = (changes: Partial<ProjectDocument["styleTokens"]>) => {
    setPreviousTokens(project.styleTokens);
    const styleTokens = { ...project.styleTokens, ...changes };
    update({
      styleTokens,
      styles: {
        ...project.styles,
        selectedThemeId: "student-unit-two",
        tokens: {
          ...project.styles.tokens,
          accent: styleTokens.primary,
          surface: styleTokens.background,
          text: styleTokens.text,
        },
      },
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-04.theme.css"),
        {
          id: "lesson-04.theme.css",
          type: "code",
          name: "CSS 视觉变量",
          content: styleTokensToCss(styleTokens),
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    });
  };

  const generateTokens = () => {
    const draft = demoStyleTokenSuggestion({ ...project, moodboard: { ...project.moodboard, items } });
    const timestamp = now();
    setBeforeTokens(project.styleTokens);
    setConfirmedTokens([]);
    update({
      moodboard: { ...project.moodboard, items },
      styleTokens: draft,
      aiDrafts: [...project.aiDrafts, {
        id: `ai-style-${Date.now()}`,
        lessonId: "lesson-04",
        kind: "styleTokens",
        payload: JSON.stringify(draft),
        generatedAt: timestamp,
        disclaimer: "本地设计规则依据 finalIntent、服务对象、情绪板、图片候选色和关键词生成。",
      }],
    });
    setPanel("theme");
  };

  const confirmTokens = () => {
    const timestamp = now();
    const draftId = project.aiDrafts.filter((item) => item.kind === "styleTokens").at(-1)?.id ?? "student-only";
    update({
      studentRevisions: [...project.studentRevisions, {
        id: `revision-style-${Date.now()}`,
        draftId,
        lessonId: "lesson-04",
        kind: "styleTokens",
        payload: JSON.stringify(project.styleTokens),
        reason: project.moodboard.reason || "逐项检查并确认视觉参数",
        confirmedAt: timestamp,
      }],
      decisions: [...project.decisions, {
        id: `decision-style-${Date.now()}`,
        lessonId: "lesson-04",
        toolId: "appearance-theme",
        title: "确认 App 视觉风格",
        reason: project.moodboard.reason || "适合目标用户并保持清楚易读",
        suggestedBy: "student",
        createdAt: timestamp,
      }],
    });
  };

  const contrast = contrastRatio(project.styleTokens.text, project.styleTokens.background);
  const bodySize = Number.parseInt(project.styleTokens.fontScale[1], 10) || 0;
  const spacing = Number.parseInt(project.styleTokens.spacing, 10) || 0;
  const width = Number.parseInt(project.styleTokens.pageWidth, 10) || 0;

  return (
    <div className="unit-two-studio">
      <nav className="tool-journey">
        <button aria-pressed={panel === "moodboard"} onClick={() => setPanel("moodboard")} type="button">1 视觉情绪板</button>
        <button aria-pressed={panel === "theme"} onClick={() => setPanel("theme")} type="button">2 ThemeEditor</button>
      </nav>

      {panel === "moodboard" && (
        <section className="moodboard-studio">
          <header><div><small>读取第3课页面结构与第1课兴趣图片</small><h3>选择、收藏并组合参考图</h3></div><label className="upload-button">导入自己的参考图<input accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async () => {
              const imageData = String(reader.result);
              const colors = await extractImageColors(imageData);
              changeMoodboard({ items: [...items, { id: `upload-${Date.now()}`, source: "upload", title: file.name, imageData, colors, favorite: true, selected: true }] });
            };
            reader.readAsDataURL(file);
          }} type="file" /></label></header>
          <div className="reference-gallery">
            {items.map((item) => (
              <article className={item.selected ? "selected" : ""} key={item.id}>
                <img alt={item.title} src={item.imageData} />
                <b>{item.title}</b>
                <div>
                  <button aria-pressed={item.favorite} onClick={() => changeMoodboard({ items: items.map((entry) => entry.id === item.id ? { ...entry, favorite: !entry.favorite } : entry) })} type="button">{item.favorite ? "★ 已收藏" : "☆ 收藏"}</button>
                  <button aria-pressed={item.selected} onClick={() => changeMoodboard({ items: items.map((entry) => entry.id === item.id ? { ...entry, selected: !entry.selected } : entry) })} type="button">{item.selected ? "移出风格板" : "加入风格板"}</button>
                </div>
                <div className="palette">{item.colors.map((color) => <button aria-label={`使用颜色 ${color}`} key={color} onClick={() => changeTokens({ primary: color })} style={{ background: color }} type="button" />)}</div>
              </article>
            ))}
          </div>
          <details><summary>导入第一单元画板与兴趣素材</summary><p>兴趣图片 {project.interestMap.nodes.length} 张，画板元素 {project.sketch.elements.length} 个。</p><button disabled={!project.sketch.compressedImage} onClick={() => project.sketch.compressedImage && changeMoodboard({ items: [...items, { id: "unit-one-board", source: "unit-one", title: "第一单元画板", imageData: project.sketch.compressedImage, colors: ["#7C3AED", "#F59E0B", "#FFFFFF"], favorite: true, selected: true }] })} type="button">加入第一单元画板</button></details>
          <div className="mood-controls">
            <label>学生关键词<div><input onChange={(event) => setKeyword(event.target.value)} value={keyword} /><button onClick={() => { if (keyword.trim()) { changeMoodboard({ keywords: [...project.moodboard.keywords, keyword.trim()] }); setKeyword(""); } }} type="button">添加</button></div></label>
            <label>字体气质<select onChange={(event) => changeMoodboard({ fontMood: event.target.value })} value={project.moodboard.fontMood}><option value="">请选择</option><option>圆润友好</option><option>清楚理性</option><option>活力醒目</option><option>安静自然</option></select></label>
            <label>形状<select onChange={(event) => changeMoodboard({ shape: event.target.value })} value={project.moodboard.shape}><option>圆润卡片</option><option>几何切角</option><option>轻盈线框</option></select></label>
            <label>圆角<input onChange={(event) => changeMoodboard({ radius: `${event.target.value}px` })} type="range" min="0" max="32" value={Number.parseInt(project.moodboard.radius, 10) || 16} /></label>
            <label>间距<input onChange={(event) => changeMoodboard({ spacing: `${event.target.value}px` })} type="range" min="8" max="32" value={Number.parseInt(project.moodboard.spacing, 10) || 16} /></label>
            <label>按钮感觉<select onChange={(event) => changeMoodboard({ buttonFeel: event.target.value })} value={project.moodboard.buttonFeel}><option>solid</option><option>soft</option><option>outline</option></select></label>
            <label className="wide">选择理由<textarea onChange={(event) => changeMoodboard({ reason: event.target.value })} placeholder="为什么这种视觉适合服务对象？" value={project.moodboard.reason} /></label>
          </div>
          <div className="visual-style-board" style={{ background: project.styleTokens.background, borderRadius: project.moodboard.radius || "16px" }}>
            <span>风格板</span><h3 style={{ color: project.styleTokens.primary }}>{project.moodboard.keywords.join(" · ") || "我的视觉关键词"}</h3><p>{project.moodboard.fontMood} · {project.moodboard.shape} · {project.moodboard.buttonFeel}</p>
          </div>
          <button className="button button-primary" disabled={!items.some((item) => item.selected) || project.moodboard.reason.trim().length < 4} onClick={generateTokens} type="button">AI 生成 StyleTokens 草稿</button>
        </section>
      )}

      {panel === "theme" && (
        <section className="theme-editor">
          <div className="theme-controls">
            <label>主色<input onChange={(event) => changeTokens({ primary: event.target.value })} type="color" value={project.styleTokens.primary} /><code>{project.styleTokens.primary}</code></label>
            <label>辅助色<input onChange={(event) => changeTokens({ secondary: event.target.value })} type="color" value={project.styleTokens.secondary} /><code>{project.styleTokens.secondary}</code></label>
            <label>背景色<input onChange={(event) => changeTokens({ background: event.target.value })} type="color" value={project.styleTokens.background} /><code>{project.styleTokens.background}</code></label>
            <label>文字色<input onChange={(event) => changeTokens({ text: event.target.value })} type="color" value={project.styleTokens.text} /><code>{project.styleTokens.text}</code></label>
            <label>正文大小<input min="12" max="24" onChange={(event) => changeTokens({ fontScale: [project.styleTokens.fontScale[0], `${event.target.value}px`, project.styleTokens.fontScale[2]] })} type="range" value={bodySize} /><output>{bodySize}px</output></label>
            <label>标题大小<input min="24" max="52" onChange={(event) => changeTokens({ fontScale: [project.styleTokens.fontScale[0], project.styleTokens.fontScale[1], `${event.target.value}px`] })} type="range" value={Number.parseInt(project.styleTokens.fontScale[2], 10)} /></label>
            <label>间距<input min="8" max="36" onChange={(event) => changeTokens({ spacing: `${event.target.value}px` })} type="range" value={spacing} /></label>
            <label>卡片圆角<input min="0" max="36" onChange={(event) => changeTokens({ radius: `${event.target.value}px` })} type="range" value={Number.parseInt(project.styleTokens.radius, 10)} /></label>
            <label>边框<select onChange={(event) => changeTokens({ border: event.target.value })} value={project.styleTokens.border}><option>1px solid #E5E7EB</option><option>2px solid #172033</option><option>none</option></select></label>
            <label>阴影<select onChange={(event) => changeTokens({ shadow: event.target.value })} value={project.styleTokens.shadow}><option>0 8px 24px rgba(23,32,51,.12)</option><option>0 2px 8px rgba(23,32,51,.08)</option><option>none</option></select></label>
            <label>按钮状态<select onChange={(event) => changeTokens({ buttonStyle: event.target.value })} value={project.styleTokens.buttonStyle}><option>solid</option><option>soft</option><option>outline</option></select></label>
            <label>页面宽度<input min="520" max="1200" onChange={(event) => changeTokens({ pageWidth: `${event.target.value}px` })} type="range" value={width} /></label>
          </div>
          <div className="theme-live-area">
            <div className="theme-preview before"><small>修改前</small><PreviewCard project={project} tokens={beforeTokens} /></div>
            <div className="theme-preview after"><small>实时页面</small><PreviewCard project={project} tokens={project.styleTokens} /></div>
            <div className="theme-preview narrow"><small>窄屏 768px</small><PreviewCard project={project} tokens={project.styleTokens} /></div>
          </div>
          <pre className="css-variables">{styleTokensToCss(project.styleTokens)}</pre>
          <div className="token-confirmations">
            <b>逐项检查并确认</b>
            {tokenConfirmations.map((label) => <button aria-pressed={confirmedTokens.includes(label)} key={label} onClick={() => setConfirmedTokens((items) => items.includes(label) ? items.filter((item) => item !== label) : [...items, label])} type="button">{confirmedTokens.includes(label) ? "✓" : "○"} {label}</button>)}
          </div>
          <div className="theme-checks">
            <p className={contrast >= 4.5 ? "pass" : "fail"}>对比度 {contrast.toFixed(2)}：{contrast >= 4.5 ? "通过" : "需达到 4.5"}</p>
            <p className={bodySize >= 16 ? "pass" : "fail"}>正文字号：{bodySize >= 16 ? "通过" : "至少 16px"}</p>
            <p className={spacing >= 12 ? "pass" : "fail"}>间距：{spacing >= 12 ? "通过" : "过于拥挤"}</p>
            <p className={width <= 1200 ? "pass" : "fail"}>平板适配：受控预览可收缩</p>
          </div>
          <div className="studio-actions"><button onClick={() => changeTokens(previousTokens)} type="button">恢复上一个版本</button><button className="button button-primary" disabled={confirmedTokens.length !== tokenConfirmations.length} onClick={confirmTokens} type="button">保存已逐项确认的 StyleTokens</button></div>
        </section>
      )}
    </div>
  );
}

function PreviewCard({ project, tokens }: { project: ProjectDocument; tokens: ProjectDocument["styleTokens"] }) {
  return (
    <div style={{ background: tokens.background, border: tokens.border, borderRadius: tokens.radius, boxShadow: tokens.shadow, color: tokens.text, fontFamily: tokens.fontFamily, gap: tokens.spacing, maxWidth: tokens.pageWidth }}>
      <h2 style={{ color: tokens.primary, fontSize: tokens.fontScale[2] }}>{project.title}</h2>
      <p style={{ fontSize: tokens.fontScale[1] }}>{project.intent.statement || "这是你的应用页面内容。"}</p>
      <button style={{ background: tokens.buttonStyle === "outline" ? "transparent" : tokens.primary, borderColor: tokens.primary, color: tokens.buttonStyle === "outline" ? tokens.primary : "#fff" }} type="button">按钮悬停 / 按下</button>
    </div>
  );
}
