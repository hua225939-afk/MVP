import type { ProjectDocument } from "@/lib/projects/project-document";
import { createDemoDebugDraft } from "@/lib/unit-four/app-workflow";

export type DebugAIInput = {
  report: ProjectDocument["bugReports"][number];
  screenshot: string | null;
  annotations: ProjectDocument["bugAnnotations"];
  relatedCode: string;
  testLogs: string[];
};

export type DebugAIResult = ProjectDocument["aiDebugDrafts"][number];

export interface DebugAIService {
  analyze(input: DebugAIInput, signal?: AbortSignal): Promise<DebugAIResult>;
}

export class DemoDebugAIService implements DebugAIService {
  async analyze(input: DebugAIInput) {
    return createDemoDebugDraft({
      ...input.report,
      codeExcerpt: input.relatedCode,
      testLog: input.testLogs,
    });
  }
}

export class LiveDebugAIService implements DebugAIService {
  async analyze(input: DebugAIInput, signal?: AbortSignal) {
    const response = await fetch("/api/debug-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    const result = await response.json() as DebugAIResult & { error?: string };
    if (!response.ok) throw new Error(result.error || "AI 调试服务暂时不可用");
    return result;
  }
}
