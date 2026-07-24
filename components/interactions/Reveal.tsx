"use client";

import { useState } from "react";
import type { InteractionBlock } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type RevealBlock = Extract<InteractionBlock, { type: "reveal" }>;

export function Reveal({
  block,
  progress,
  onChange,
}: {
  block: RevealBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
}) {
  const [revealed, setRevealed] = useState(progress?.value === true);

  const showAnswer = () => {
    setRevealed(true);
    onChange({ value: true, completed: true, correct: true });
  };

  return (
    <section className="interaction-card" data-testid={`block-${block.id}`}>
      <div className="interaction-label">点击揭晓</div>
      <h3>{block.title}</h3>
      <p className="interaction-question">{block.prompt}</p>
      {revealed ? (
        <div className="feedback feedback-success" role="status">
          <span className="feedback-icon">✓</span>
          <p>{block.content}</p>
        </div>
      ) : (
        <button className="button button-primary" type="button" onClick={showAnswer}>
          <span>✦</span>
          {block.buttonLabel}
        </button>
      )}
    </section>
  );
}
