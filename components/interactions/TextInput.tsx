"use client";

import { useState } from "react";
import { validateTextInput } from "@/lib/interaction-logic";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type TextInputBlock = Extract<InteractionAtom, { type: "textInput" }>;

export function TextInput({
  block,
  progress,
  onChange,
}: {
  block: TextInputBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
}) {
  const [value, setValue] = useState(
    typeof progress?.value === "string" ? progress.value : "",
  );
  const [result, setResult] = useState<"idle" | "correct" | "wrong">(
    progress?.correct ? "correct" : "idle",
  );

  const submit = () => {
    const correct = validateTextInput(value, block.validation);
    setResult(correct ? "correct" : "wrong");
    onChange({
      value,
      completed: correct,
      correct,
      attempts: (progress?.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="interaction-card" data-testid={`block-${block.id}`}>
      <div className="interaction-label">填写答案</div>
      <h3>{block.title}</h3>
      <label className="interaction-question" htmlFor={block.id}>
        {block.question}
      </label>
      <div className="input-row">
        <input
          id={block.id}
          onChange={(event) => {
            setValue(event.target.value);
            setResult("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && value.trim()) submit();
          }}
          placeholder={block.placeholder}
          value={value}
        />
        <button
          className="button button-primary"
          disabled={!value.trim()}
          onClick={submit}
          type="button"
        >
          提交
        </button>
      </div>
      {result !== "idle" && (
        <div
          className={`feedback ${
            result === "correct" ? "feedback-success" : "feedback-error"
          }`}
          role="status"
        >
          <span className="feedback-icon">{result === "correct" ? "✓" : "?"}</span>
          <p>
            {result === "correct"
              ? block.successMessage
              : block.hint ?? "答案还差一点，再试一次吧。"}
          </p>
        </div>
      )}
    </section>
  );
}
