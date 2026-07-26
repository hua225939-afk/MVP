import {
  DemoDebugAIService,
  type DebugAIInput,
  type DebugAIResult,
} from "@/lib/ai/debug-ai-service";

const MAX_BODY_LENGTH = 1_200_000;
const TIMEOUT_MS = 20_000;

function outputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  return payload.output_text ??
    payload.output?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) {
    return Response.json({ error: "调试材料过长，请减少截图或日志后重试。" }, { status: 413 });
  }
  let input: DebugAIInput;
  try {
    input = JSON.parse(raw) as DebugAIInput;
  } catch {
    return Response.json({ error: "调试输入格式无效。" }, { status: 400 });
  }
  if (!input.report?.id || !Array.isArray(input.annotations) || !Array.isArray(input.testLogs)) {
    return Response.json({ error: "缺少 Bug 报告、标注或测试日志。" }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(await new DemoDebugAIService().analyze(input));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const textContext = JSON.stringify({
      report: input.report,
      annotations: input.annotations.map((item) => ({
        shape: item.shape,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        text: item.text,
        problemType: item.problemType,
      })),
      relatedCode: input.relatedCode,
      testLogs: input.testLogs,
    });
    const content: Array<Record<string, unknown>> = [{
      type: "input_text",
      text: `你是青少年编程课的调试助手。读取截图、标注区域、复现步骤、预期与实际、相关代码和测试日志，输出三个局部修复候选。不要自动修改整个项目。每项必须包含 cause, checkLocation, fix, risk, retest。输入：${textContext}`,
    }];
    if (input.screenshot?.startsWith("data:image/")) {
      content.push({ type: "input_image", image_url: input.screenshot, detail: "high" });
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_DEBUG_MODEL || process.env.OPENAI_CREATIVE_MODEL || "gpt-5-mini",
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "debug_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                suggestions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      cause: { type: "string" },
                      checkLocation: { type: "string" },
                      fix: { type: "string" },
                      risk: { type: "string" },
                      retest: { type: "string" },
                    },
                    required: ["cause", "checkLocation", "fix", "risk", "retest"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        },
      }),
      signal: controller.signal,
    });
    const payload = await response.json() as {
      error?: { message?: string };
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    if (!response.ok) throw new Error(payload.error?.message || "AI 请求失败");
    const text = outputText(payload);
    if (!text) throw new Error("AI 没有返回调试建议");
    const parsed = JSON.parse(text) as {
      suggestions: Array<Omit<DebugAIResult["suggestions"][number], "id">>;
    };
    return Response.json({
      id: `debug-${input.report.id}`,
      bugReportId: input.report.id,
      mode: "live",
      disclaimer: "Live AI 已读取本次提交的截图、标注、复现、代码与日志；输出仍是草稿，必须由学生比较、修改、选择和复测。",
      inputSummary: [
        "截图与标注区域",
        `${input.report.reproSteps.length} 步复现`,
        `${input.report.componentIds.length} 个关联组件`,
        `${input.testLogs.length} 条测试日志`,
      ],
      suggestions: parsed.suggestions.map((item, index) => ({
        id: `${input.report.id}-live-${index + 1}`,
        ...item,
      })),
    } satisfies DebugAIResult);
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "AI 调试请求超时，请重试。"
      : error instanceof Error ? error.message : "AI 调试服务暂时不可用";
    return Response.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
