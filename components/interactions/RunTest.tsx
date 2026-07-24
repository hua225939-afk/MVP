"use client";

import { useState } from "react";
import type { InteractionBlock } from "@/lib/lesson-schema";
import type { InteractionProgress } from "@/lib/progress-storage";

type RunTestBlock = Extract<InteractionBlock, { type: "runTest" }>;

export function RunTest({
  block,
  progress,
  onChange,
}: {
  block: RunTestBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
}) {
  const [code, setCode] = useState(
    typeof progress?.value === "string" ? progress.value : block.initialCode,
  );
  const [hasRun, setHasRun] = useState(progress?.completed ?? false);

  const results = block.tests.map((test) => ({
    ...test,
    passed: code.toLowerCase().includes(test.includes.toLowerCase()),
  }));
  const allPassed = results.every((result) => result.passed);

  const run = () => {
    setHasRun(true);
    onChange({ value: code, completed: allPassed, correct: allPassed });
  };

  return (
    <section className="interaction-card interaction-card-wide" data-testid={`block-${block.id}`}>
      <div className="interaction-label">安全测试</div>
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
            spellCheck={false}
            value={code}
          />
        </div>
        <div className="test-panel">
          <div className="test-panel-title">
            <span>测试清单</span>
            <span>{hasRun ? `${results.filter((item) => item.passed).length}/${results.length}` : "待运行"}</span>
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
        运行测试
      </button>
      {hasRun && (
        <div
          className={`feedback ${allPassed ? "feedback-success" : "feedback-error"}`}
          role="status"
        >
          <span className="feedback-icon">{allPassed ? "✓" : "↻"}</span>
          <p>
            {allPassed
              ? "全部通过！代码已经满足本关要求。"
              : "还有测试没有通过。根据右侧提示修改后再运行一次。"}
          </p>
        </div>
      )}
    </section>
  );
}
