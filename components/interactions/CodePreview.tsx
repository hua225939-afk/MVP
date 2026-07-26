"use client";

import { useState } from "react";
import { getGeneratedCode } from "@/lib/task-builder-logic";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type CodePreviewBlock = Extract<InteractionAtom, { type: "codePreview" }>;

export function CodePreview({
  block,
  progress,
  allProgress,
  onChange,
  readOnly = false,
}: {
  block: CodePreviewBlock;
  progress?: InteractionProgress;
  allProgress: Record<string, InteractionProgress>;
  onChange: (next: InteractionProgress) => void;
  readOnly?: boolean;
}) {
  const interaction = block.preview.interaction;
  const [activated, setActivated] = useState(false);
  const [counter, setCounter] = useState(
    interaction.type === "counter" ? interaction.start : 0,
  );
  const completed = progress?.completed ?? false;
  const sourceCode = block.sourceAtomId
    ? getGeneratedCode(allProgress[block.sourceAtomId]?.value)
    : undefined;
  const code = sourceCode ?? block.code ?? "";

  const activate = () => {
    setActivated(true);
    if (interaction.type === "counter") {
      setCounter((current) => current + interaction.step);
    }
  };

  const reset = () => {
    setActivated(false);
    if (interaction.type === "counter") setCounter(interaction.start);
  };

  const accent =
    activated && interaction.type === "color"
      ? interaction.clickedAccent
      : block.preview.accent;

  return (
    <section
      className="interaction-card interaction-card-wide"
      data-testid={`block-${block.id}`}
    >
      <div className="interaction-label">
        {readOnly ? "代码预览" : "试航窗口"}
      </div>
      <h3>{block.title}</h3>
      <p className="interaction-question">{block.description}</p>
      <div className="code-preview-grid">
        <div className="code-window">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <b>{block.language}</b>
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
        <div
          className={`mini-preview ${activated ? "mini-preview-celebrate" : ""}`}
          style={{ "--preview-accent": accent } as React.CSSProperties}
        >
          {block.preview.eyebrow && <span>{block.preview.eyebrow}</span>}
          <h4>
            {activated && interaction.type === "message"
              ? interaction.clickedHeading
              : block.preview.heading}
          </h4>
          <p>
            {interaction.type === "counter"
              ? `${interaction.counterLabel}：${counter}`
              : activated &&
                  (interaction.type === "message" || interaction.type === "color")
                ? interaction.clickedText
                : block.preview.text}
          </p>
          <button onClick={activate} style={{ background: accent }} type="button">
            {interaction.buttonLabel}
          </button>
          {interaction.type === "counter" && (
            <button className="preview-reset" onClick={reset} type="button">
              {interaction.resetLabel}
            </button>
          )}
          {activated && interaction.type === "none" && (
            <small className="preview-observation" role="status">
              {interaction.observationMessage}
            </small>
          )}
        </div>
      </div>
      <button
        className={`button ${completed ? "button-success" : "button-secondary"}`}
        onClick={() =>
          onChange({
            value: true,
            completed: true,
            correct: true,
            attempts: (progress?.attempts ?? 0) + 1,
            updatedAt: new Date().toISOString(),
          })
        }
        type="button"
      >
        {completed ? `✓ ${block.confirmationLabel}` : block.confirmationLabel}
      </button>
    </section>
  );
}
