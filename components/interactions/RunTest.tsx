"use client";

import { useState } from "react";
import { evaluateContainsTests } from "@/lib/interaction-logic";
import { getGeneratedCode } from "@/lib/task-builder-logic";
import type { InteractionAtom } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type RunTestBlock = Extract<InteractionAtom, { type: "runTest" }>;

export function RunTest({
  block,
  progress,
  allProgress,
  onChange,
  readOnly = false,
}: {
  block: RunTestBlock;
  progress?: InteractionProgress;
  allProgress: Record<string, InteractionProgress>;
  onChange: (next: InteractionProgress) => void;
  readOnly?: boolean;
}) {
  const sourceProgress = block.sourceAtomId
    ? allProgress[block.sourceAtomId]
    : undefined;
  const sourceCode =
    getGeneratedCode(sourceProgress?.value) ?? block.initialCode ?? "";
  const progressIsNewer =
    progress &&
    (!sourceProgress ||
      new Date(progress.updatedAt).getTime() >=
        new Date(sourceProgress.updatedAt).getTime());
  const [code, setCode] = useState(
    progressIsNewer && typeof progress?.value === "string"
      ? progress.value
      : sourceCode,
  );
  const [hasRun, setHasRun] = useState(
    Boolean(progressIsNewer && progress?.attempts),
  );

  const results = evaluateContainsTests(code, block.tests);
  const allPassed = results.every((result) => result.passed);

  const run = () => {
    setHasRun(true);
    onChange({
      value: code,
      completed: allPassed,
      correct: allPassed,
      attempts: (progress?.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section
      className="interaction-card interaction-card-wide"
      data-testid={`block-${block.id}`}
    >
      <div className="interaction-label">
        {readOnly ? "安全规则检查" : "故障扫描"}
      </div>
      <h3>{block.title}</h3>
      <p className="interaction-question">{block.description}</p>
      <div className="test-grid">
        <div className="code-editor">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <b>{block.language}</b>
          </div>
          <textarea
            aria-label={`${block.title}代码编辑器`}
            onChange={(event) => {
              setCode(event.target.value);
              setHasRun(false);
            }}
            readOnly={!block.editable}
            spellCheck={false}
            value={code}
          />
        </div>
        <div className="test-panel">
          <div className="test-panel-title">
            <span>{readOnly ? "测试清单" : "试航检查清单"}</span>
            <span>
              {hasRun
                ? `${results.filter((item) => item.passed).length}/${results.length}`
                : readOnly
                  ? "待运行"
                  : "待扫描"}
            </span>
          </div>
          {results.map((result) => (
            <div className="test-result" key={result.id}>
              <span className={hasRun && result.passed ? "test-pass" : "test-wait"}>
                {hasRun ? (result.passed ? "✓" : "×") : "·"}
              </span>
              <div>
                <b>{result.label}</b>
                {hasRun && !result.passed && <small>{result.message}</small>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="button button-primary" onClick={run} type="button">
        <span>▶</span>
        {readOnly ? "运行测试" : "运行故障扫描"}
      </button>
      {hasRun && (
        <div
          className={`feedback ${allPassed ? "feedback-success" : "feedback-error"}`}
          role="status"
        >
          <span className="feedback-icon">{allPassed ? "✓" : "↻"}</span>
          <p>{allPassed ? block.successMessage : block.retryMessage}</p>
        </div>
      )}
    </section>
  );
}
