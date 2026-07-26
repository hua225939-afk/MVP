"use client";
/* eslint-disable @next/next/no-img-element -- 故事板复用 ProjectDocument 中的本地数据 URL 缩略图。 */

import { useMemo, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { galaxyIsTooLarge } from "@/lib/unit-one/creative-tools";

type Region = "mustHave" | "shouldHave" | "future" | "outOfScope";
const regionLabels: Record<Region, string> = {
  mustHave: "内圈 · 本次必须完成",
  shouldHave: "中圈 · 辅助功能",
  future: "外圈 · 以后可以增加",
  outOfScope: "边界外 · 这次不做",
};

type StoryFrame = { id: string; title: string; text: string; keywords: string; icon: string; doodle: string };

function readStoryboard(project: ProjectDocument): StoryFrame[] {
  const artifact = project.artifacts.find((item) => item.id === "lesson-02.storyboard");
  try {
    return artifact ? JSON.parse(artifact.content) as StoryFrame[] : [];
  } catch {
    return [];
  }
}

export function ProjectBoundaryTool({
  project,
  onChange,
}: {
  project: ProjectDocument;
  onChange: (project: ProjectDocument) => void;
}) {
  const [tab, setTab] = useState<"galaxy" | "story" | "confirm" | "test">("galaxy");
  const [selectedFeature, setSelectedFeature] = useState("");
  const initialFrames = useMemo(() => readStoryboard(project), [project]);
  const [frames, setFrames] = useState<StoryFrame[]>(initialFrames.length ? initialFrames : [
    { id: "problem", title: "1 用户遇到什么问题", text: project.finalIntent?.problem || "", keywords: "", icon: "!", doodle: "" },
    { id: "use", title: "2 用户怎样使用 App", text: project.finalIntent?.coreFunctions[0] || "", keywords: "", icon: "→", doodle: "" },
    { id: "result", title: "3 用户得到什么结果", text: project.finalIntent?.possibleOutputs[0] || "", keywords: "", icon: "✓", doodle: "" },
  ]);
  const [taskDraft, setTaskDraft] = useState(project.intent.statement);
  const [reason, setReason] = useState("");

  const future = useMemo(() => {
    const artifact = project.artifacts.find((item) => item.id === "lesson-02.future-features");
    try { return artifact ? JSON.parse(artifact.content) as string[] : []; } catch { return []; }
  }, [project.artifacts]);
  const now = () => new Date().toISOString();
  const update = (changes: Partial<ProjectDocument>) => onChange({ ...project, ...changes });
  const regionValues: Record<Region, string[]> = {
    mustHave: project.scope.mustHave,
    shouldHave: project.scope.shouldHave,
    future,
    outOfScope: project.scope.outOfScope,
  };

  const saveRegions = (regions: Record<Region, string[]>, decision?: string) => {
    const timestamp = now();
    update({
      scope: {
        ...project.scope,
        mustHave: regions.mustHave,
        shouldHave: regions.shouldHave,
        outOfScope: regions.outOfScope,
      },
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-02.future-features"),
        { id: "lesson-02.future-features", type: "document", name: "以后可以增加", content: JSON.stringify(regions.future), createdAt: timestamp, updatedAt: timestamp },
      ],
      decisions: decision ? [...project.decisions, { id: `decision-scope-${timestamp.replaceAll(/[^0-9]/g, "")}`, lessonId: "lesson-02", toolId: "project-boundary", title: "调整项目范围", reason: decision, suggestedBy: "student", createdAt: timestamp }] : project.decisions,
    });
  };

  const moveFeature = (feature: string, target: Region) => {
    const next = Object.fromEntries(Object.entries(regionValues).map(([region, items]) => [region, items.filter((item) => item !== feature)])) as Record<Region, string[]>;
    next[target] = [...next[target], feature];
    saveRegions(next);
    setSelectedFeature("");
  };

  const saveStoryboard = () => {
    const timestamp = now();
    const coreFlow = frames.map((frame) => frame.text).filter(Boolean);
    update({
      scope: { ...project.scope, coreFlow },
      pages: frames.map((frame, index) => ({ id: `page-${frame.id}`, name: frame.title, slug: frame.id, order: index, structureRootIds: [] })),
      artifacts: [
        ...project.artifacts.filter((item) => item.id !== "lesson-02.storyboard"),
        { id: "lesson-02.storyboard", type: "document", name: "三格用户故事板", content: JSON.stringify(frames), createdAt: timestamp, updatedAt: timestamp },
      ],
    });
  };

  const suggestions = project.finalIntent?.coreFunctions ?? [];
  const tooLarge = galaxyIsTooLarge(project);
  const storyComplete = frames.every((frame) => frame.text.trim() && (frame.keywords.trim() || frame.doodle.trim()));

  return (
    <div className="boundary-tool">
      {!project.finalIntent ? (
        <div className="lesson-project-required"><h3>第2课只读取第1课确认后的 finalIntent</h3><p>请先返回意图画布完成学生修改与确认，AI 原稿不会直接进入本课。</p></div>
      ) : (
        <>
          <nav className="tool-journey">
            <button aria-pressed={tab === "galaxy"} onClick={() => setTab("galaxy")} type="button">1 功能星系</button>
            <button aria-pressed={tab === "story"} onClick={() => setTab("story")} type="button">2 三格故事板</button>
            <button aria-pressed={tab === "confirm"} onClick={() => setTab("confirm")} type="button">3 任务确认</button>
            <button aria-pressed={tab === "test"} onClick={() => setTab("test")} type="button">4 范围测试</button>
          </nav>

          {tab === "galaxy" && (
            <section className="function-galaxy">
              <div className="galaxy-suggestions">
                <span>从 finalIntent 带入的 AI 建议</span>
                {suggestions.map((feature) => <button key={feature} onClick={() => {
                  if (Object.values(regionValues).flat().includes(feature)) return;
                  saveRegions({ ...regionValues, mustHave: [...regionValues.mustHave, feature] });
                }} type="button">+ {feature}</button>)}
                <button onClick={() => {
                  const feature = window.prompt("新增什么功能？")?.trim();
                  if (feature) saveRegions({ ...regionValues, shouldHave: [...regionValues.shouldHave, feature] });
                }} type="button">+ 我的功能</button>
              </div>
              <div className="galaxy-board">
                <div className="galaxy-center"><small>中心 · 核心功能</small><b>{project.scope.mustHave[0] || "选择一个核心功能"}</b></div>
                {(Object.keys(regionLabels) as Region[]).map((region) => (
                  <section className={`galaxy-region ${region}`} key={region}>
                    <h3>{regionLabels[region]}</h3>
                    {regionValues[region].map((feature) => (
                      <button aria-pressed={selectedFeature === feature} key={feature} onClick={() => setSelectedFeature(feature)} type="button">{feature}</button>
                    ))}
                  </section>
                ))}
              </div>
              {selectedFeature && (
                <div className="feature-editor">
                  <b>“{selectedFeature}”移动到：</b>
                  {(Object.keys(regionLabels) as Region[]).map((region) => <button key={region} onClick={() => moveFeature(selectedFeature, region)} type="button">{regionLabels[region]}</button>)}
                  <button onClick={() => {
                    const renamed = window.prompt("修改功能名称", selectedFeature)?.trim();
                    if (!renamed) return;
                    const region = (Object.keys(regionValues) as Region[]).find((key) => regionValues[key].includes(selectedFeature));
                    if (!region) return;
                    const next = { ...regionValues, [region]: regionValues[region].map((item) => item === selectedFeature ? renamed : item) };
                    saveRegions(next); setSelectedFeature(renamed);
                  }} type="button">修改名称</button>
                  <button onClick={() => {
                    const next = Object.fromEntries(Object.entries(regionValues).map(([key, items]) => [key, items.filter((item) => item !== selectedFeature)])) as Record<Region, string[]>;
                    saveRegions(next, `删除过于复杂的功能：${selectedFeature}`); setSelectedFeature("");
                  }} type="button">删除</button>
                </div>
              )}
              {tooLarge && <p className="scope-warning">范围偏大：内圈最多建议 3 项，中圈最多建议 4 项。把功能移到外圈或边界外后再测试。</p>}
              <details><summary>比较修改前后的项目范围</summary><p>修改前 AI 建议：{suggestions.join("、") || "无"}</p><p>当前必须：{project.scope.mustHave.join("、") || "未选择"}</p><p>本次不做：{project.scope.outOfScope.join("、") || "未记录"}</p></details>
            </section>
          )}

          {tab === "story" && (
            <section className="storyboard-editor">
              <p>每格都要保留学生自己的文字，并加入关键词或涂鸦。可从第1课兴趣地图选择素材提示。</p>
              <div className="storyboard-grid">
                {frames.map((frame, index) => (
                  <article key={frame.id}>
                    <header><span>{frame.icon}</span><h3>{frame.title}</h3></header>
                    <div className="story-illustration">{project.interestMap.nodes[index]?.imageData ? <img alt="" src={project.interestMap.nodes[index].imageData} /> : <span>{frame.icon}</span>}<i>→</i></div>
                    <label>文字<textarea onChange={(event) => setFrames((current) => current.map((item) => item.id === frame.id ? { ...item, text: event.target.value } : item))} value={frame.text} /></label>
                    <label>关键词<input onChange={(event) => setFrames((current) => current.map((item) => item.id === frame.id ? { ...item, keywords: event.target.value } : item))} value={frame.keywords} /></label>
                    <label>涂鸦说明<input onChange={(event) => setFrames((current) => current.map((item) => item.id === frame.id ? { ...item, doodle: event.target.value } : item))} placeholder="用线条或一句话描述画面中的箭头" value={frame.doodle} /></label>
                  </article>
                ))}
              </div>
              <button className="button button-primary" onClick={saveStoryboard} type="button">保存三格故事板</button>
            </section>
          )}

          {tab === "confirm" && (
            <section className="task-confirm">
              <div className="ai-mode demo">本地规则整理：只把已保存故事板串成任务说明，不声称理解涂鸦。</div>
              <button onClick={() => setTaskDraft(`${frames[0].text}；用户通过${frames[1].text}；最后${frames[2].text}。`)} type="button">AI 整理为任务说明</button>
              <label>学生继续修改<textarea onChange={(event) => setTaskDraft(event.target.value)} value={taskDraft} /></label>
              <label>修改原因<textarea onChange={(event) => setReason(event.target.value)} value={reason} /></label>
              <button className="button button-primary" disabled={taskDraft.trim().length < 12 || reason.trim().length < 4} onClick={() => {
                const timestamp = now();
                update({
                  intent: { ...project.intent, statement: taskDraft },
                  audience: { ...project.audience, primary: project.finalIntent!.audience },
                  scenario: { context: project.finalIntent!.scenario, problem: project.finalIntent!.problem },
                  components: project.scope.mustHave.map((feature, index) => ({ id: `component-plan-${index}`, pageId: project.pages[index % Math.max(project.pages.length, 1)]?.id || "page-problem", type: "planned-feature", name: feature, props: { priority: "must" } })),
                  decisions: [...project.decisions, { id: `decision-task-${Date.now()}`, lessonId: "lesson-02", toolId: "project-boundary", title: "确认 App 范围与任务说明", reason, suggestedBy: "student", createdAt: timestamp }],
                });
              }} type="button">确认最终 App 任务</button>
            </section>
          )}

          {tab === "test" && (
            <section className="unit-tests">
              <p className={project.scope.mustHave.length > 0 ? "pass" : "fail"}>核心功能：{project.scope.mustHave.length > 0 ? "已确定" : "未确定"}</p>
              <p className={!tooLarge ? "pass" : "fail"}>范围大小：{tooLarge ? "过大，请返回星系调整" : "适合本单元"}</p>
              <p className={storyComplete ? "pass" : "fail"}>三格故事板：{storyComplete ? "完整" : "每格需要文字与关键词/涂鸦"}</p>
              <p className={project.intent.statement.length >= 12 ? "pass" : "fail"}>任务说明：{project.intent.statement.length >= 12 ? "学生已确认" : "尚未确认"}</p>
              <button onClick={() => {
                const timestamp = now();
                const checks = [
                  ["scope", project.scope.mustHave.length > 0 && !tooLarge],
                  ["storyboard", storyComplete],
                  ["task", project.intent.statement.length >= 12],
                ] as const;
                update({ tests: [...project.tests.filter((item) => item.toolId !== "project-boundary"), ...checks.map(([id, passed]) => ({ id: `lesson-02-${id}`, name: id, status: passed ? "pass" as const : "fail" as const, projectRevision: project.revision, toolId: "project-boundary", message: passed ? "检查通过" : "返回对应步骤修改后重试", attempts: (project.tests.find((item) => item.id === `lesson-02-${id}`)?.attempts ?? 0) + 1, updatedAt: timestamp }))] });
              }} type="button">记录范围测试并重试</button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
