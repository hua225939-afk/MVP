"use client";

import { useState } from "react";
import type { InteractionBlock } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type CodePreviewBlock = Extract<InteractionBlock, { type: "codePreview" }>;

export function CodePreview({
  block,
  progress,
  onChange,
}: {
  block: CodePreviewBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
}) {
  const [celebrating, setCelebrating] = useState(false);
  const completed = progress?.completed ?? false;

  return (
    <section className="interaction-card interaction-card-wide" data-testid={`block-${block.id}`}>
      <div className="interaction-label">代码预览</div>
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
            <code>{block.code}</code>
          </pre>
        </div>
        <div
          className={`mini-preview ${celebrating ? "mini-preview-celebrate" : ""}`}
          style={{ "--preview-accent": block.preview.accent } as React.CSSProperties}
        >
          {block.preview.eyebrow && <span>{block.preview.eyebrow}</span>}
          <h4>{celebrating ? "太棒了，挑战成功！" : block.preview.heading}</h4>
          <p>{block.preview.text}</p>
          {block.preview.buttonLabel && (
            <button
              onClick={() => setCelebrating((current) => !current)}
              style={{ background: block.preview.accent }}
              type="button"
            >
              {celebrating ? "再看一次" : block.preview.buttonLabel}
            </button>
          )}
        </div>
      </div>
      <button
        className={`button ${completed ? "button-success" : "button-secondary"}`}
        onClick={() => onChange({ value: true, completed: true, correct: true })}
        type="button"
      >
        {completed ? "✓ 已看懂代码与预览" : "我看懂了"}
      </button>
    </section>
  );
}
