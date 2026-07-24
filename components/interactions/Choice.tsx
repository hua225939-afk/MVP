"use client";

import { useState } from "react";
import type { InteractionBlock } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type ChoiceBlock = Extract<InteractionBlock, { type: "choice" }>;

export function Choice({
  block,
  progress,
  onChange,
}: {
  block: ChoiceBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
}) {
  const [selected, setSelected] = useState(
    typeof progress?.value === "string" ? progress.value : "",
  );
  const [submitted, setSubmitted] = useState(progress?.completed ?? false);

  const submit = () => {
    if (!selected) return;
    const correct = selected === block.correctOptionId;
    setSubmitted(true);
    onChange({ value: selected, completed: correct, correct });
  };

  return (
    <section className="interaction-card" data-testid={`block-${block.id}`}>
      <div className="interaction-label">单项选择</div>
      <h3>{block.title}</h3>
      <p className="interaction-question">{block.question}</p>
      <div className="choice-list" role="radiogroup" aria-label={block.question}>
        {block.options.map((option, index) => {
          const active = selected === option.id;
          return (
            <button
              aria-checked={active}
              className={`choice-option ${active ? "choice-option-active" : ""}`}
              key={option.id}
              onClick={() => {
                setSelected(option.id);
                setSubmitted(false);
              }}
              role="radio"
              type="button"
            >
              <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
              <span>{option.label}</span>
              <span className="choice-check">{active ? "●" : "○"}</span>
            </button>
          );
        })}
      </div>
      <button
        className="button button-primary"
        disabled={!selected}
        onClick={submit}
        type="button"
      >
        检查答案
      </button>
      {submitted && (
        <div
          className={`feedback ${
            selected === block.correctOptionId ? "feedback-success" : "feedback-error"
          }`}
          role="status"
        >
          <span className="feedback-icon">
            {selected === block.correctOptionId ? "✓" : "↻"}
          </span>
          <p>
            {selected === block.correctOptionId
              ? block.explanation
              : "再想一想：先判断每一段内容在网页中扮演什么角色。"}
          </p>
        </div>
      )}
    </section>
  );
}
