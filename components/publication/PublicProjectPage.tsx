"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/config/brand";
import { getBrowserProjectRepository } from "@/lib/projects/project-repository";
import { createPublicProject } from "@/lib/unit-five/publishing";

type PublicProject = NonNullable<ReturnType<typeof createPublicProject>>;

function ReadOnlyAppExperience({ project }: { project: PublicProject }) {
  const interaction = project.preview.interactions.find((item) => item.trigger === "click");
  const input = project.preview.inputs[0];
  const [clicked, setClicked] = useState(false);
  const [value, setValue] = useState("");
  const feedback = String(
    interaction?.config.feedback ??
    interaction?.config.message ??
    project.preview.intent ??
    "体验已收到你的操作。",
  );
  return (
    <div
      className="public-app-runtime"
      data-access="read-only"
      style={{
        "--public-accent": project.preview.styleTokens.primary,
        background: project.preview.styleTokens.background,
        color: project.preview.styleTokens.text,
        fontFamily: project.preview.styleTokens.fontFamily,
      } as React.CSSProperties}
    >
      <small>{project.preview.scenario || "只读应用体验"}</small>
      <h3>{project.preview.title}</h3>
      <p>{clicked ? feedback : project.oneLine}</p>
      {input && <label>{input.label || input.name}<input onChange={(event) => setValue(event.target.value)} placeholder={input.placeholder} value={value} /></label>}
      <button onClick={() => setClicked(true)} type="button">{String(project.preview.components.find((item) => item.type === "button")?.props.label ?? "开始体验")}</button>
      <span>访客可以操作体验，但不能编辑项目、测试或发布内容。</span>
    </div>
  );
}

export function PublicProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<PublicProject | null | undefined>();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const source = getBrowserProjectRepository()?.get(projectId);
      setProject(source ? createPublicProject(source) : null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [projectId]);

  if (project === undefined) return <main className="public-empty">正在读取公开作品…</main>;
  if (project === null) {
    return <main className="public-empty"><span>PRIVATE OR NOT FOUND</span><h1>这个作品尚未公开</h1><p>公开页只显示 publication.status 为 published 的当前项目。</p><Link href="/gallery">返回作品广场</Link></main>;
  }

  return (
    <main className="public-project" style={{ background: project.visuals.background, color: project.visuals.textColor }}>
      <nav><Link href="/gallery">{brand.studentSpaceName} · {brand.galleryName}</Link><span>学生公开作品 · 只读</span></nav>
      <header className="public-project-hero">
        <div>
          <span>{project.visuals.icon} {project.category}</span>
          <h1>{project.title}</h1>
          <p>{project.oneLine}</p>
          <div>{project.featureTags.map((tag) => <b key={tag}>{tag}</b>)}</div>
          <a href="#experience">进入只读体验 ↓</a>
        </div>
        {project.cover && <div aria-label={`${project.title}产品封面`} className="public-cover" style={{ backgroundImage: `url("${project.cover}")` }} />}
      </header>

      <section className="public-summary-grid">
        <article><small>为谁设计</small><h2>{project.audience}</h2></article>
        <article><small>解决什么问题</small><h2>{project.problem}</h2></article>
        <article><small>怎样体验</small><h2>{project.experienceInstructions}</h2></article>
      </section>

      <section id="experience" className="public-section">
        <header><small>LIVE EXPERIENCE</small><h2>应用实时预览与体验入口</h2></header>
        <ReadOnlyAppExperience project={project} />
      </section>

      {project.visuals.screenshots.length > 0 && <section className="public-section">
        <header><small>REPRESENTATIVE PAGES</small><h2>代表性页面</h2></header>
        <div className="public-screenshots">{project.visuals.screenshots.map((shot) => <article key={shot.artifactId}><div style={{ backgroundImage: `url("${shot.content}")`, backgroundPosition: `${shot.cropX}% ${shot.cropY}%`, backgroundSize: `${shot.zoom * 100}%` }} /><p>{shot.caption}</p></article>)}</div>
      </section>}

      <section className="public-section">
        <header><small>PROJECT STORY</small><h2>从最初兴趣到发布作品</h2></header>
        <div className="public-story">{project.story.map((node, index) => <article key={node.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{node.title}</h3><p>{node.note || node.summary}</p><small>{node.markers.map((marker) => markerLabel(marker)).join(" · ")}</small></div>{node.screenshot && <div aria-label={node.title} className="story-public-shot" style={{ backgroundImage: `url("${node.screenshot}")` }} />}</article>)}</div>
      </section>

      <section className="public-section">
        <header><small>VERSION JOURNEY</small><h2>版本历程</h2></header>
        <div className="public-versions">{project.versions.map((version) => <article key={version.label}><b>{version.label}</b><p>{version.description}</p><small>{version.changes.join(" · ")}</small></article>)}</div>
      </section>

      <section className="public-section public-reflection">
        <header><small>LEARNING REFLECTION</small><h2>学生学习回顾</h2></header>
        <p>{project.learningReflection || project.presentation.find((item) => item.id === "student-decision")?.text}</p>
        <details><summary>查看一分钟介绍最终稿</summary><pre>{project.finalScript}</pre></details>
      </section>
      <footer><b>{project.title}</b><span>公开只读页不包含编辑按钮、测试答案、教师数据、私人图片或未选择草稿。</span></footer>
    </main>
  );
}

function markerLabel(marker: string) {
  return {
    "most-important": "最重要的决定",
    "ai-helped": "AI帮助",
    "ai-rejected": "未采用AI建议",
    "peer-changed": "同伴反馈带来改变",
  }[marker] ?? marker;
}

export function PublicationGallery() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [category, setCategory] = useState("全部");
  const [tag, setTag] = useState("全部");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const repository = getBrowserProjectRepository();
      setProjects(
        (repository?.list() ?? [])
          .map(createPublicProject)
          .filter((item): item is PublicProject => item !== null),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const categories = useMemo(() => ["全部", ...new Set(projects.map((project) => project.category))], [projects]);
  const tags = useMemo(() => ["全部", ...new Set(projects.flatMap((project) => project.featureTags))], [projects]);
  const visible = projects.filter((project) =>
    (category === "全部" || project.category === category) &&
    (tag === "全部" || project.featureTags.includes(tag)),
  );

  return (
    <main className="publication-gallery">
      <header>
        <nav><Link href="/student">← 返回{brand.studentSpaceName}</Link><span>{brand.platformName}</span></nav>
        <small>PUBLICATION GALLERY</small>
        <h1>{brand.galleryName}</h1>
        <p>这里只展示学生主动发布的作品。没有点赞、评论、关注或公开社交。</p>
      </header>
      <section className="gallery-filters">
        <label>主题分类<select onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>核心功能<select onChange={(event) => setTag(event.target.value)} value={tag}>{tags.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span>{visible.length} 个已发布作品</span>
      </section>
      {visible.length === 0 ? <section className="gallery-empty"><span>等待第一颗作品星球</span><h2>当前筛选下还没有已发布项目</h2><p>项目在第13课完成隐私检查并设为 published 后才会出现。</p></section> : <section className="gallery-grid">{visible.map((project) => <article key={project.projectId}>
        {project.cover ? <div className="gallery-cover" style={{ backgroundImage: `url("${project.cover}")` }} /> : <div className="gallery-cover placeholder">{project.visuals.icon}</div>}
        <small>{project.category}</small><h2>{project.title}</h2><p>{project.oneLine}</p>
        <div>{project.featureTags.map((item) => <span key={item}>{item}</span>)}</div>
        <footer><Link href={`/showcase/${project.projectId}`}>查看公开页</Link><Link href={`/showcase/${project.projectId}#experience`}>进入只读体验</Link></footer>
      </article>)}</section>}
    </main>
  );
}
