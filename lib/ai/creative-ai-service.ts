import type { ProjectDocument } from "@/lib/projects/project-document";
import {
  demoComponentSpec,
  demoStructureDraft,
  demoStyleTokens,
} from "../unit-two/creative-tools.ts";

export type CreativeAIInput = {
  interestMap: ProjectDocument["interestMap"];
  inspirationSources: ProjectDocument["inspirationSources"];
  keywords: string[];
  notes: string[];
  sketchImage: string | null;
  studentNote: string;
};

export type CreativeAIOutput = NonNullable<ProjectDocument["aiDraft"]>;
export type CreativeAIResult = {
  mode: "live" | "demo";
  output: CreativeAIOutput;
  provenance: NonNullable<ProjectDocument["aiProvenance"]>;
};

export interface CreativeAIService {
  understand(input: CreativeAIInput, signal?: AbortSignal): Promise<CreativeAIResult>;
}

export function demoStructureSuggestion(project: ProjectDocument) {
  return demoStructureDraft(project);
}

export function demoStyleTokenSuggestion(project: ProjectDocument) {
  return demoStyleTokens(project);
}

export function demoSafeComponentSuggestion(
  name: string,
  purpose: string,
  annotations: Array<{ kind: "input" | "button" | "result" | "note"; label: string }>,
) {
  return demoComponentSpec(name, purpose, annotations);
}

export function demoCreativeIntent(input: CreativeAIInput): CreativeAIOutput {
  const problemNode = input.interestMap.nodes.find((node) => node.role === "problem");
  const audienceNode = input.interestMap.nodes.find((node) => node.role === "audience");
  const audience = audienceNode?.label || "遇到这个问题的同学";
  const problem = problemNode?.detail || input.inspirationSources[0]?.detail || "把零散事情整理清楚";
  const keywords = input.keywords.length ? input.keywords : ["清楚", "提醒", "记录"];
  return {
    appIntent: `为${audience}制作一个帮助${problem}的网页 App`,
    audience,
    scenario: input.inspirationSources[0]?.title || "日常生活",
    problem,
    coreFunctions: [`记录${keywords[0]}`, `查看${keywords[1] ?? "进度"}`, "获得清楚反馈"],
    possibleInputs: ["关键词", "一次选择或记录"],
    possibleOutputs: ["任务反馈", "简短结果卡"],
    visualStyle: keywords.includes("活力") ? "明快、有节奏" : "克制、清楚、温和",
    uncertainties: ["本地规则没有理解画板图像，请学生补充画面中最重要的部分。"],
  };
}

export class DemoAIService implements CreativeAIService {
  async understand(input: CreativeAIInput): Promise<CreativeAIResult> {
    return {
      mode: "demo",
      output: demoCreativeIntent(input),
      provenance: {
        provider: "local-rules",
        model: "unit-one-demo-rules-v1",
        generatedAt: new Date().toISOString(),
        disclaimer: "本地规则演示：仅根据文字和结构化数据生成，没有理解画板图像。",
      },
    };
  }
}

export class LiveAIService implements CreativeAIService {
  async understand(input: CreativeAIInput, signal?: AbortSignal): Promise<CreativeAIResult> {
    const response = await fetch("/api/creative-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    const data = await response.json() as CreativeAIResult & { error?: string };
    if (!response.ok) throw new Error(data.error || "AI 服务暂时不可用");
    return data;
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 1,
) {
  let error: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (current) {
      error = current;
    }
  }
  throw error;
}
