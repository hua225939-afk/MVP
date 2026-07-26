"use client";

import { useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";
import { PREVIEW_RENDERER_MODE } from "@/lib/workbench-config";

export function ControlledProjectPreview({
  project,
}: {
  project: ProjectDocument;
}) {
  const [activationCount, setActivationCount] = useState(
    Number(
      project.interactions.find((item) => item.trigger === "click")?.config
        .startValue,
    ) || 0,
  );
  const [message, setMessage] = useState(
    project.structure.find((node) => node.type === "text")?.content ??
      "等待启动",
  );
  const interaction = project.interactions.find(
    (item) => item.trigger === "click",
  );
  const accent = project.styles.tokens.accent ?? "#7C3AED";

  const activate = () => {
    if (!interaction) {
      setMessage("按钮已点击，下一步可以安装点击事件。");
      return;
    }
    const feedback = String(interaction.config.feedback ?? "任务已启动");
    setMessage(feedback);
    if (
      interaction.action === "counter" ||
      String(interaction.config.effects).includes("counter")
    ) {
      setActivationCount((current) => current + 1);
    }
  };

  return (
    <div
      className="controlled-preview"
      data-preview-renderer={PREVIEW_RENDERER_MODE}
      style={{ "--workbench-accent": accent } as React.CSSProperties}
    >
      <small>{project.scenario.context || "我的生活应用"}</small>
      <h2>{project.title}</h2>
      <p>{message || project.intent.statement || "这里会显示应用反馈。"}</p>
      <button onClick={activate} type="button">
        {String(project.components[0]?.props.label ?? "启动任务")}
      </button>
      <span>启动次数：{activationCount}</span>
      <em>受控 React 预览 · 不执行任意代码</em>
    </div>
  );
}
