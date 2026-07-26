import type { ProjectDocument } from "../projects/project-document.ts";

export const SAFE_COMPONENT_TYPES = [
  "info-card",
  "image-card",
  "button",
  "input",
  "option",
  "list",
  "progress",
  "alert",
  "result-card",
  "navigation",
  "modal",
] as const;

export type SafeComponentType = (typeof SAFE_COMPONENT_TYPES)[number];

export const HTML_TAGS = [
  "header", "main", "section", "footer", "nav", "article", "div",
  "h1", "h2", "p", "img", "button", "input", "ul", "li",
] as const;

export function structureToHtml(project: ProjectDocument) {
  const children = new Map<string | null, ProjectDocument["structure"]>();
  for (const node of project.structure) {
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }
  const render = (node: ProjectDocument["structure"][number], depth: number): string => {
    const tag = node.htmlTag ?? ({
      heading: "h2", text: "p", image: "img", button: "button", input: "input",
      navigation: "nav", list: "ul",
    } as Record<string, string>)[node.type] ?? "section";
    const indent = "  ".repeat(depth);
    if (tag === "img" || tag === "input") {
      return `${indent}<${tag} aria-label="${escapeHtml(node.content)}" />`;
    }
    const nested = (children.get(node.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((child) => render(child, depth + 1))
      .join("\n");
    const content = nested || escapeHtml(node.content);
    return `${indent}<${tag}>\n${content ? `${nested ? "" : "  ".repeat(depth + 1)}${content}\n` : ""}${indent}</${tag}>`;
  };
  return [...project.pages]
    .sort((a, b) => a.order - b.order)
    .map((page) => `<!-- ${page.name} -->\n${project.structure
      .filter((node) => node.pageId === page.id && node.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map((node) => render(node, 0))
      .join("\n")}`)
    .join("\n\n");
}

export function safeHtmlToStructure(
  html: string,
  pageId: string,
): ProjectDocument["structure"] {
  const tokens = html.match(/<\/?[a-zA-Z0-9]+(?:\s[^>]*)?>|[^<]+/g) ?? [];
  const stack: Array<{ id: string; tag: string }> = [];
  const nodes: ProjectDocument["structure"] = [];
  let sequence = 0;
  for (const token of tokens) {
    const closing = token.match(/^<\/([a-zA-Z0-9]+)>$/);
    if (closing) {
      if (stack.at(-1)?.tag === closing[1].toLowerCase()) stack.pop();
      continue;
    }
    const opening = token.match(/^<([a-zA-Z0-9]+)/);
    if (opening) {
      const tag = opening[1].toLowerCase();
      if (!HTML_TAGS.includes(tag as (typeof HTML_TAGS)[number])) continue;
      const id = `node-code-${sequence++}`;
      const parent = stack.at(-1)?.id ?? null;
      const type = ({
        h1: "heading", h2: "heading", p: "text", img: "image", button: "button",
        input: "input", nav: "navigation", ul: "list", li: "text",
      } as const)[tag as "h1"] ?? (["header", "main", "section", "footer", "article", "div"].includes(tag) ? "section" : "container");
      nodes.push({
        id,
        pageId,
        parentId: parent,
        type,
        htmlTag: tag as ProjectDocument["structure"][number]["htmlTag"],
        order: nodes.filter((item) => item.parentId === parent).length,
        content: "",
      });
      if (!["img", "input"].includes(tag) && !token.endsWith("/>")) stack.push({ id, tag });
      continue;
    }
    const content = token.trim();
    const current = stack.at(-1);
    if (content && current) {
      const index = nodes.findIndex((node) => node.id === current.id);
      if (index >= 0) nodes[index] = { ...nodes[index], content };
    }
  }
  return nodes;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function scanStructure(project: ProjectDocument) {
  const pageIds = new Set(project.pages.map((page) => page.id));
  const nodeIds = new Set(project.structure.map((node) => node.id));
  return [
    {
      id: "valid-page",
      name: "区域属于有效页面",
      passed: project.structure.every((node) => pageIds.has(node.pageId)),
    },
    {
      id: "valid-parent",
      name: "父子层级有效",
      passed: project.structure.every((node) => node.parentId === null || nodeIds.has(node.parentId)),
    },
    {
      id: "non-empty",
      name: "内容区域不为空",
      passed: project.structure.every((node) => node.content.trim() || ["main", "section", "div"].includes(node.htmlTag ?? "")),
    },
    {
      id: "semantic-root",
      name: "页面包含 main",
      passed: project.pages.every((page) => project.structure.some((node) => node.pageId === page.id && node.htmlTag === "main")),
    },
  ];
}

export function demoStructureDraft(project: ProjectDocument) {
  const pageNames = project.scope.coreFlow.length
    ? project.scope.coreFlow.slice(0, 3).map((step, index) => step.slice(0, 12) || `页面 ${index + 1}`)
    : ["开始页", "操作页", "结果页"];
  const pages = pageNames.map((name, index) => ({
    id: `page-ai-${index + 1}`,
    name,
    slug: `page-${index + 1}`,
    order: index,
    structureRootIds: [`node-ai-main-${index + 1}`],
  }));
  const structure = pages.flatMap((page, index) => [
    { id: `node-ai-header-${index + 1}`, pageId: page.id, parentId: null, type: "container" as const, htmlTag: "header" as const, order: 0, content: project.title },
    { id: `node-ai-main-${index + 1}`, pageId: page.id, parentId: null, type: "section" as const, htmlTag: "main" as const, order: 1, content: "" },
    { id: `node-ai-heading-${index + 1}`, pageId: page.id, parentId: `node-ai-main-${index + 1}`, type: "heading" as const, htmlTag: "h1" as const, order: 0, content: page.name },
    { id: `node-ai-action-${index + 1}`, pageId: page.id, parentId: `node-ai-main-${index + 1}`, type: "button" as const, htmlTag: "button" as const, order: 1, content: index === pages.length - 1 ? "查看结果" : "继续" },
    { id: `node-ai-footer-${index + 1}`, pageId: page.id, parentId: null, type: "container" as const, htmlTag: "footer" as const, order: 2, content: "我的 App" },
  ]);
  return { pages, structure };
}

export function demoStyleTokens(project: ProjectDocument): ProjectDocument["styleTokens"] {
  const energetic = [...project.moodboard.keywords, project.finalIntent?.visualStyle ?? ""]
    .join(" ")
    .match(/活力|明快|运动/);
  const colors = project.moodboard.items
    .filter((item) => item.selected)
    .flatMap((item) => item.colors);
  return {
    ...project.styleTokens,
    primary: colors[0] ?? (energetic ? "#F97316" : "#6D28D9"),
    secondary: colors[1] ?? (energetic ? "#0EA5E9" : "#14B8A6"),
    background: colors[2] ?? "#F8FAFC",
    fontFamily: project.moodboard.fontMood || "system-ui",
    spacing: project.moodboard.spacing || "16px",
    radius: project.moodboard.radius || "18px",
    buttonStyle: project.moodboard.buttonFeel || "solid",
  };
}

export function demoComponentSpec(
  name: string,
  purpose: string,
  annotations: Array<{ kind: "input" | "button" | "result" | "note"; label: string }>,
) {
  const needs = annotations.map((item) => item.kind);
  const safeComposition: SafeComponentType[] = [];
  if (needs.includes("input")) safeComposition.push("input");
  if (needs.includes("button")) safeComposition.push("button");
  if (needs.includes("result")) safeComposition.push("result-card");
  if (safeComposition.length === 0) safeComposition.push("info-card");
  return {
    name: name || "我的自定义组件",
    purpose: purpose || "帮助用户完成一个清楚的小任务",
    contentAreas: annotations.map((item) => item.label).filter(Boolean),
    editableProps: ["标题", "说明", "颜色", "按钮文字"],
    interactionNeeds: [...new Set(needs.filter((item) => item !== "note"))],
    safeComposition,
  };
}

function luminance(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return 0;
  const channels = [0, 2, 4].map((index) => {
    const channel = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function styleTokensToCss(tokens: ProjectDocument["styleTokens"]) {
  return `:root {
  --color-primary: ${tokens.primary};
  --color-secondary: ${tokens.secondary};
  --color-background: ${tokens.background};
  --color-text: ${tokens.text};
  --font-family: ${tokens.fontFamily};
  --font-small: ${tokens.fontScale[0]};
  --font-body: ${tokens.fontScale[1]};
  --font-title: ${tokens.fontScale[2]};
  --space: ${tokens.spacing};
  --radius: ${tokens.radius};
  --shadow: ${tokens.shadow};
  --border: ${tokens.border};
  --page-width: ${tokens.pageWidth};
}`;
}

export function isSafeComponentType(value: string): value is SafeComponentType {
  return SAFE_COMPONENT_TYPES.includes(value as SafeComponentType);
}
