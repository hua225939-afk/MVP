import type { InteractionAtom } from "@/lib/lesson-schema";

export type TaskBuilderBlock = Extract<InteractionAtom, { type: "taskBuilder" }>;
export type TaskBuilderValues = Record<string, string | string[]>;

export type TaskBuilderPayload = {
  schemaVersion: 1;
  fields: TaskBuilderValues;
  generatedCode: string;
  changeCount: number;
  savedAt: string | null;
};

export function getTaskBuilderDefaults(block: TaskBuilderBlock): TaskBuilderValues {
  return Object.fromEntries(
    block.fields.map((field) => [
      field.id,
      Array.isArray(field.defaultValue)
        ? [...field.defaultValue]
        : field.defaultValue,
    ]),
  );
}

export function parseTaskBuilderPayload(value?: string | boolean) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as Partial<TaskBuilderPayload>;
    if (
      parsed.schemaVersion !== 1 ||
      !parsed.fields ||
      typeof parsed.fields !== "object" ||
      typeof parsed.generatedCode !== "string" ||
      typeof parsed.changeCount !== "number"
    ) {
      return null;
    }
    return parsed as TaskBuilderPayload;
  } catch {
    return null;
  }
}

function valueAsText(values: TaskBuilderValues, fieldId: string) {
  const value = values[fieldId];
  return Array.isArray(value) ? value.join("、") : (value ?? "");
}

function valueAsList(values: TaskBuilderValues, fieldId: string) {
  const value = values[fieldId];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildTaskCode(
  block: TaskBuilderBlock,
  values: TaskBuilderValues,
) {
  const preview = block.preview;
  if (preview.type === "webCard") {
    const appName = valueAsText(values, preview.appNameFieldId);
    const direction = valueAsText(values, preview.directionFieldId);
    const title = valueAsText(values, preview.titleFieldId);
    const accent = valueAsText(values, preview.accentFieldId);
    const style = valueAsText(values, preview.styleFieldId);
    const button = valueAsText(values, preview.buttonFieldId);
    const message = valueAsText(values, preview.messageFieldId);
    const responsive =
      valueAsText(values, preview.adaptationFieldId) === "responsive";

    return [
      responsive
        ? '<meta name="viewport" content="width=device-width, initial-scale=1">'
        : "<!-- TODO: 添加页面适配设置 -->",
      `<main data-app-name="${escapeHtml(appName)}" data-direction="${escapeHtml(direction)}">`,
      `  <article data-card-style="${escapeHtml(style)}" style="--accent:${escapeHtml(accent)}">`,
      `    <h1>${escapeHtml(title)}</h1>`,
      `    <p>${escapeHtml(message)}</p>`,
      `    <button>${escapeHtml(button)}</button>`,
      "  </article>",
      "</main>",
    ].join("\n");
  }

  if (preview.type === "interactiveCard") {
    const task = valueAsText(values, preview.taskFieldId);
    const effects = valueAsList(values, preview.effectsFieldId);
    const feedback = valueAsText(values, preview.feedbackFieldId);
    const accent = valueAsText(values, preview.accentFieldId);
    const startValue = Number(valueAsText(values, preview.startValueFieldId)) || 0;
    const hasMessage = effects.includes("message");
    const hasColor = effects.includes("color");
    const hasCounter = effects.includes("counter");
    const counterLine =
      preview.deliberateBug === "counter-and-reset"
        ? "  setCount(count + 0); // BUG: 连续点击没有增加"
        : "  setCount(count + 1);";
    const resetLine =
      preview.deliberateBug === "counter-and-reset"
        ? "  setCount(1); // BUG: 应重置为 0"
        : "  setCount(0);";

    return [
      `// 本地模板：${task || "互动任务"}`,
      `const [count, setCount] = useState(${startValue});`,
      `const [message, setMessage] = useState('等待启动');`,
      `const [accent, setAccent] = useState('#7C3AED');`,
      "",
      "function handleActivate() {",
      hasMessage ? `  setMessage('${feedback}');` : "  // 未安装文字变化效果",
      hasColor ? `  setAccent('${accent}');` : "  // 未安装颜色变化效果",
      counterLine,
      "}",
      "",
      "function handleReset() {",
      resetLine,
      "  setMessage('等待启动');",
      "  setAccent('#7C3AED');",
      "}",
      "",
      `<button onClick={handleActivate}>${preview.activateLabel}</button>`,
      `<button onClick={handleReset}>${preview.resetLabel}</button>`,
      hasCounter ? "<p>启动次数：{count}</p>" : "<!-- 数字效果未显示 -->",
    ].join("\n");
  }

  return JSON.stringify(values, null, 2);
}

function valuesEqual(first: string | string[], second: string | string[]) {
  if (Array.isArray(first) && Array.isArray(second)) {
    return (
      first.length === second.length &&
      first.every((value, index) => value === second[index])
    );
  }
  return first === second;
}

export function evaluateTaskBuilder(
  block: TaskBuilderBlock,
  values: TaskBuilderValues,
) {
  const defaults = getTaskBuilderDefaults(block);
  const changeCount = block.fields.filter(
    (field) => !valuesEqual(values[field.id], defaults[field.id]),
  ).length;
  const requiredFieldsComplete = block.fields.every((field) => {
    if (!field.required) return true;
    const value = values[field.id];
    if (field.control === "multiSelect") {
      return Array.isArray(value) && value.length >= field.minSelections;
    }
    if (field.control === "text") {
      return typeof value === "string" && value.trim().length >= field.minLength;
    }
    return typeof value === "string" && value.trim().length > 0;
  });
  const requiredChangesComplete = block.requiredChangeFieldIds.every(
    (fieldId) => !valuesEqual(values[fieldId], defaults[fieldId]),
  );

  return {
    changeCount,
    ready:
      requiredFieldsComplete &&
      requiredChangesComplete &&
      changeCount >= block.minimumChanges,
    generatedCode: buildTaskCode(block, values),
  };
}

export function getGeneratedCode(value?: string | boolean) {
  return parseTaskBuilderPayload(value)?.generatedCode;
}
