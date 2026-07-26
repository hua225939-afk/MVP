"use client";

import { useState } from "react";
import {
  evaluateTaskBuilder,
  getTaskBuilderDefaults,
  parseTaskBuilderPayload,
  type TaskBuilderBlock,
  type TaskBuilderValues,
} from "@/lib/task-builder-logic";
import type { InteractionProgress } from "@/lib/progress-storage";

export function TaskBuilder({
  block,
  progress,
  onChange,
  readOnly = false,
}: {
  block: TaskBuilderBlock;
  progress?: InteractionProgress;
  onChange: (next: InteractionProgress) => void;
  readOnly?: boolean;
}) {
  const savedPayload = parseTaskBuilderPayload(progress?.value);
  const [values, setValues] = useState<TaskBuilderValues>(
    savedPayload?.fields ?? getTaskBuilderDefaults(block),
  );
  const [saved, setSaved] = useState(progress?.completed ?? false);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewMessage, setPreviewMessage] = useState("等待启动");
  const [previewAccent, setPreviewAccent] = useState("#7C3AED");
  const evaluation = evaluateTaskBuilder(block, values);

  const emit = (
    nextValues: TaskBuilderValues,
    completed: boolean,
    savedAt: string | null,
  ) => {
    const nextEvaluation = evaluateTaskBuilder(block, nextValues);
    onChange({
      value: JSON.stringify({
        schemaVersion: 1,
        fields: nextValues,
        generatedCode: nextEvaluation.generatedCode,
        changeCount: nextEvaluation.changeCount,
        savedAt,
      }),
      completed,
      correct: completed,
      attempts: (progress?.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateValue = (fieldId: string, value: string | string[]) => {
    const nextValues = { ...values, [fieldId]: value };
    setValues(nextValues);
    if (
      block.preview.type === "interactiveCard" &&
      fieldId === block.preview.startValueFieldId &&
      typeof value === "string"
    ) {
      setPreviewCount(Number(value) || 0);
    }
    setSaved(false);
    emit(nextValues, false, null);
  };

  const save = () => {
    if (!evaluation.ready) return;
    setSaved(true);
    emit(values, true, new Date().toISOString());
  };

  const preview = block.preview;
  const getText = (fieldId: string) => {
    const value = values[fieldId];
    return Array.isArray(value) ? value.join("、") : value;
  };
  const getList = (fieldId: string) => {
    const value = values[fieldId];
    return Array.isArray(value) ? value : [];
  };

  const activateInteractivePreview = () => {
    if (preview.type !== "interactiveCard") return;
    const effects = getList(preview.effectsFieldId);
    if (effects.includes("message")) {
      setPreviewMessage(getText(preview.feedbackFieldId) || "任务已启动");
    }
    if (effects.includes("color")) {
      setPreviewAccent(getText(preview.accentFieldId) || "#7C3AED");
    }
    setPreviewCount((current) => current + 1);
  };

  const resetInteractivePreview = () => {
    if (preview.type !== "interactiveCard") return;
    setPreviewCount(Number(getText(preview.startValueFieldId)) || 0);
    setPreviewMessage("等待启动");
    setPreviewAccent("#7C3AED");
  };

  return (
    <section
      className="interaction-card interaction-card-wide task-builder"
      data-testid={`block-${block.id}`}
    >
      <div className="interaction-label">
        {readOnly
          ? preview.type === "record"
            ? "学习记录"
            : "结构化任务"
          : preview.type === "record"
            ? "造物档案"
            : "创造台"}
      </div>
      <h3>{block.title}</h3>
      <p className="interaction-question">{block.description}</p>

      <div className={`task-builder-layout task-builder-${preview.type}`}>
        <div className="task-builder-fields">
          {block.fields.map((field) => (
            <fieldset className="task-field" key={field.id}>
              <legend>{field.label}</legend>
              {field.control === "text" && (
                <input
                  aria-label={field.label}
                  onChange={(event) => updateValue(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  value={getText(field.id)}
                />
              )}
              {field.control === "select" && (
                <div className="task-option-grid">
                  {field.options.map((option) => (
                    <button
                      aria-pressed={getText(field.id) === option.value}
                      className={
                        getText(field.id) === option.value ? "task-option-active" : ""
                      }
                      key={option.id}
                      onClick={() => updateValue(field.id, option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {field.control === "color" && (
                <div className="task-color-options">
                  {field.options.map((option) => (
                    <button
                      aria-label={`${field.label}：${option.label}`}
                      aria-pressed={getText(field.id) === option.value}
                      className={
                        getText(field.id) === option.value ? "task-color-active" : ""
                      }
                      key={option.id}
                      onClick={() => updateValue(field.id, option.value)}
                      style={{ "--task-color": option.value } as React.CSSProperties}
                      type="button"
                    >
                      <span />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {field.control === "multiSelect" && (
                <>
                  <div className="task-option-grid">
                    {field.options.map((option) => {
                      const selected = getList(field.id).includes(option.value);
                      return (
                        <button
                          aria-pressed={selected}
                          className={selected ? "task-option-active" : ""}
                          key={option.id}
                          onClick={() => {
                            const current = getList(field.id);
                            updateValue(
                              field.id,
                              selected
                                ? current.filter((value) => value !== option.value)
                                : [...current, option.value],
                            );
                          }}
                          type="button"
                        >
                          {selected ? "✓ " : ""}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <small>至少选择 {field.minSelections} 项</small>
                </>
              )}
            </fieldset>
          ))}
        </div>

        <div className="task-live-preview">
          <span className="task-preview-label">
            {readOnly
              ? preview.type === "record"
                ? "记录预览"
                : "实时页面预览"
              : preview.type === "record"
                ? "档案预览"
                : "实时试航窗口"}
          </span>
          {preview.type === "webCard" && (
            <div
              className={`task-web-card task-style-${getText(preview.styleFieldId) || "plain"}`}
              style={
                {
                  "--task-accent": getText(preview.accentFieldId) || "#7C3AED",
                } as React.CSSProperties
              }
            >
              <small>
                {getText(preview.appNameFieldId) || "未命名应用"} ·{" "}
                {getText(preview.directionFieldId) || "待选方向"}
              </small>
              <h4>{getText(preview.titleFieldId) || "你的页面标题"}</h4>
              <p>{getText(preview.messageFieldId) || "这里会出现提示语。"}</p>
              <button type="button">
                {getText(preview.buttonFieldId) || "按钮文字"}
              </button>
              <em>
                {getText(preview.adaptationFieldId) === "responsive"
                  ? "✓ 电脑与平板自适应"
                  : "仅电脑布局，待升级"}
              </em>
            </div>
          )}

          {preview.type === "interactiveCard" && (
            <div
              className="task-event-card"
              style={{ "--task-accent": previewAccent } as React.CSSProperties}
            >
              <small>{getText(preview.taskFieldId) || "待选互动任务"}</small>
              <h4>{previewMessage}</h4>
              <p>启动次数：{previewCount}</p>
              <div>
                <button onClick={activateInteractivePreview} type="button">
                  {preview.activateLabel}
                </button>
                <button onClick={resetInteractivePreview} type="button">
                  {preview.resetLabel}
                </button>
              </div>
              <em>已安装 {getList(preview.effectsFieldId).length} 个互动效果</em>
            </div>
          )}

          {preview.type === "record" && (
            <div className="task-record-preview">
              <h4>{preview.heading}</h4>
              {block.fields.map((field) => (
                <p key={field.id}>
                  <b>{field.label}</b>
                  <span>{getText(field.id) || "待填写"}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="task-builder-footer">
        <span>
          已完成 {evaluation.changeCount} 项有效调整
          {block.requiredChangeFieldIds.length > 0 &&
            ` · ${block.requiredChangeFieldIds.length} 项指定调整`}
        </span>
        <button
          className={`button ${saved ? "button-success" : "button-primary"}`}
          disabled={!evaluation.ready}
          onClick={save}
          type="button"
        >
          {saved
            ? `✓ ${block.successMessage}`
            : readOnly
              ? "确认结构化结果"
              : block.saveLabel}
        </button>
      </div>
    </section>
  );
}
