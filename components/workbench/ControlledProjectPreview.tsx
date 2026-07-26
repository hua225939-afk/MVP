"use client";

import { useMemo, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  evaluateProjectConditions,
  resetClickInteraction,
  runClickInteraction,
  updateStateValue,
  validateProjectInput,
  type SafeRuntime,
} from "@/lib/unit-three/interaction-engine";
import { PREVIEW_RENDERER_MODE } from "@/lib/workbench-config";

export function ControlledProjectPreview({
  project,
}: {
  project: ProjectDocument;
}) {
  const previewVersion = JSON.stringify({
    projectId: project.projectId,
    interactions: project.interactions,
    inputs: project.inputs,
    conditions: project.conditions,
    state: project.state,
    styleTokens: project.styleTokens,
  });
  return <ProjectPreviewRuntime key={previewVersion} project={project} />;
}

function ProjectPreviewRuntime({ project }: { project: ProjectDocument }) {
  const interaction = project.interactions.find((item) => item.trigger === "click");
  const inputDefinition = project.inputs[0];
  const accent = project.styleTokens.primary || project.styles.tokens.accent || "#7C3AED";
  const [runtime, setRuntime] = useState<SafeRuntime>(() =>
    resetClickInteraction(interaction, accent),
  );
  const [inputValue, setInputValue] = useState("");
  const [inputResult, setInputResult] = useState("");
  const [formalState, setFormalState] = useState(project.state[0]);

  const actionComponent = useMemo(
    () =>
      project.components.find((item) => item.id === interaction?.componentId) ??
      project.components.find((item) => item.type === "button") ??
      project.components[0],
    [interaction?.componentId, project.components],
  );

  const acceptInput = (value: string) => {
    setInputValue(value);
    if (!inputDefinition) return;
    const checked = validateProjectInput(inputDefinition, value);
    if (!checked.valid) {
      setInputResult(checked.message);
      return;
    }
    setInputResult(
      project.conditions.length > 0
        ? evaluateProjectConditions(project.conditions, value)
        : checked.result,
    );
  };

  const updateMemory = () => {
    if (!formalState) return;
    const action =
      formalState.kind === "counter"
        ? "increase"
        : formalState.kind === "recent-result"
          ? "set"
          : "toggle";
    setFormalState((current) =>
      current ? updateStateValue(current, action, inputResult) : current,
    );
  };

  return (
    <div
      className="controlled-preview"
      data-preview-renderer={PREVIEW_RENDERER_MODE}
      data-project-id={project.projectId}
      style={{
        "--workbench-accent": runtime.accent,
        background: project.styleTokens.background,
        color: project.styleTokens.text,
        fontFamily: project.styleTokens.fontFamily,
        maxWidth: project.styleTokens.pageWidth,
      } as React.CSSProperties}
    >
      <small>{project.scenario.context || "我的生活应用"}</small>
      <h2>{project.title}</h2>
      {runtime.visible && (
        <p>{runtime.message || project.intent.statement || "这里会显示应用反馈。"}</p>
      )}

      {inputDefinition && (
        <div className="preview-input">
          <label htmlFor={`preview-${inputDefinition.id}`}>
            {inputDefinition.label ?? inputDefinition.name}
          </label>
          {inputDefinition.inputType === "select" ? (
            <select
              id={`preview-${inputDefinition.id}`}
              onChange={(event) => acceptInput(event.target.value)}
              value={inputValue}
            >
              <option value="">请选择</option>
              {inputDefinition.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              id={`preview-${inputDefinition.id}`}
              onChange={(event) => acceptInput(event.target.value)}
              placeholder={inputDefinition.placeholder}
              type={inputDefinition.inputType ?? "text"}
              value={inputValue}
            />
          )}
          <output>{inputResult || "结果会实时出现在这里"}</output>
        </div>
      )}

      <button
        onClick={() => setRuntime((current) => runClickInteraction(interaction, current))}
        type="button"
      >
        {String(actionComponent?.props.label ?? actionComponent?.name ?? "启动任务")}
      </button>
      <span>启动次数：{runtime.count}</span>

      {formalState && (
        <div className="preview-memory">
          <b>{formalState.label ?? formalState.key}：{String(formalState.value)}</b>
          <button onClick={updateMemory} type="button">更新记忆</button>
          <button
            onClick={() => setFormalState((current) => current ? updateStateValue(current, "clear") : current)}
            type="button"
          >
            清空
          </button>
          <small>预览试运行不会覆盖已保存作品</small>
        </div>
      )}
      <em>受控 React 预览 · 不执行任意代码 · 当前项目 {project.projectId}</em>
    </div>
  );
}
