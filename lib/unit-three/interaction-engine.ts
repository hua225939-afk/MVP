import type { ProjectDocument } from "@/lib/projects/project-document";

export type SafeRuntime = {
  message: string;
  accent: string;
  count: number;
  visible: boolean;
};

export type InputCheck = {
  valid: boolean;
  kind: "normal" | "empty" | "abnormal";
  message: string;
  result: string;
};

type ProjectInput = ProjectDocument["inputs"][number];
type ProjectCondition = ProjectDocument["conditions"][number];
type ProjectInteraction = ProjectDocument["interactions"][number];
type ProjectState = ProjectDocument["state"][number];

export function interactionEffects(interaction?: ProjectInteraction) {
  const raw = String(interaction?.config.effects ?? interaction?.action ?? "");
  return raw.split(",").filter((effect) =>
    ["message", "color", "counter", "show", "hide"].includes(effect),
  );
}

export function runClickInteraction(
  interaction: ProjectInteraction | undefined,
  runtime: SafeRuntime,
): SafeRuntime {
  if (!interaction) {
    return { ...runtime, message: "按钮还没有安装点击事件。" };
  }
  const effects = interactionEffects(interaction);
  const increment = Number(interaction.config.increment ?? 1);
  return {
    message: effects.includes("message")
      ? String(interaction.config.feedback ?? "任务已启动")
      : runtime.message,
    accent: effects.includes("color")
      ? String(interaction.config.color ?? "#0EA5E9")
      : runtime.accent,
    count: effects.includes("counter") ? runtime.count + increment : runtime.count,
    visible: effects.includes("hide")
      ? false
      : effects.includes("show")
        ? true
        : runtime.visible,
  };
}

export function resetClickInteraction(
  interaction: ProjectInteraction | undefined,
  accent: string,
): SafeRuntime {
  return {
    message: "等待启动",
    accent,
    count: Number(interaction?.config.resetValue ?? interaction?.config.startValue ?? 0),
    visible: true,
  };
}

export function validateProjectInput(input: ProjectInput, raw: string): InputCheck {
  const trimmed = raw.trim();
  const error = input.errorMessage || "请检查输入后再试";
  if ((input.required ?? true) && trimmed.length === 0) {
    return { valid: false, kind: "empty", message: error, result: "" };
  }
  if (input.maxLength && raw.length > input.maxLength) {
    return { valid: false, kind: "abnormal", message: error, result: "" };
  }
  if (input.inputType === "number" && trimmed.length > 0) {
    const value = Number(trimmed);
    if (
      Number.isNaN(value) ||
      (input.min !== undefined && value < input.min) ||
      (input.max !== undefined && value > input.max)
    ) {
      return { valid: false, kind: "abnormal", message: error, result: "" };
    }
  }
  if (
    input.inputType === "select" &&
    trimmed.length > 0 &&
    input.options &&
    !input.options.includes(raw)
  ) {
    return { valid: false, kind: "abnormal", message: error, result: "" };
  }
  const template = input.resultTemplate || "收到：{{value}}";
  return {
    valid: true,
    kind: "normal",
    message: "输入有效",
    result: template.replaceAll("{{value}}", raw),
  };
}

function matchesCondition(condition: ProjectCondition, raw: string) {
  const compareValue = condition.compareValue ?? "";
  const operator = condition.operator ?? "eq";
  if (operator === "includes") return raw.includes(String(compareValue));
  if (operator === "eq") return raw === String(compareValue);
  const left = Number(raw);
  const right = Number(compareValue);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  if (operator === "lt") return left < right;
  if (operator === "lte") return left <= right;
  if (operator === "gte") return left >= right;
  return left > right;
}

export function evaluateProjectConditions(
  conditions: ProjectCondition[],
  raw: string,
) {
  const ordered = [...conditions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const match = ordered.find((condition) => matchesCondition(condition, raw));
  return match?.whenTrue ?? ordered.at(-1)?.whenFalse ?? "没有匹配的路线";
}

export function findConditionProblems(conditions: ProjectCondition[]) {
  const signatures = new Set<string>();
  const problems: string[] = [];
  conditions.forEach((condition) => {
    const signature = `${condition.operator}:${String(condition.compareValue)}`;
    if (signatures.has(signature)) problems.push(`重复条件：${condition.expression}`);
    signatures.add(signature);
    if (!condition.whenTrue.trim()) problems.push(`路线缺少结果：${condition.expression}`);
  });
  if (conditions.length < 2 || conditions.length > 3) {
    problems.push("判断表需要两至三个条件");
  }
  return problems;
}

export function updateStateValue(
  item: ProjectState,
  action: "increase" | "toggle" | "set" | "clear",
  payload = "",
): ProjectState {
  if (action === "clear") {
    return { ...item, value: item.kind === "counter" ? 0 : item.kind === "recent-result" ? "" : false };
  }
  if (action === "increase") {
    return { ...item, value: Number(item.value) + 1 };
  }
  if (action === "toggle") return { ...item, value: !Boolean(item.value) };
  return { ...item, value: payload };
}

export function eventCode(interaction: ProjectInteraction) {
  const effects = interactionEffects(interaction);
  const lines = effects.map((effect) => {
    if (effect === "message") return `setMessage("${String(interaction.config.feedback ?? "任务已启动")}");`;
    if (effect === "color") return `setAccent("${String(interaction.config.color ?? "#0EA5E9")}");`;
    if (effect === "counter") return `setCount(current => current + ${Number(interaction.config.increment ?? 1)});`;
    if (effect === "show") return "setVisible(true);";
    return "setVisible(false);";
  });
  return `onClick={() => {\n  ${lines.join("\n  ")}\n}}`;
}

export function conditionCode(conditions: ProjectCondition[]) {
  return [...conditions]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((condition, index) =>
      `${index === 0 ? "if" : "else if"} (${condition.expression}) {\n  showResult("${condition.whenTrue}");\n}`,
    )
    .join(" ") + ` else {\n  showResult("${conditions.at(-1)?.whenFalse ?? "请再试一次"}");\n}`;
}
