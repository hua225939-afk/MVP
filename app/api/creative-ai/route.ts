import { DemoAIService, type CreativeAIInput, type CreativeAIOutput } from "@/lib/ai/creative-ai-service";

const MAX_BODY_LENGTH = 700_000;
const TIMEOUT_MS = 20_000;

function extractOutputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  if (payload.output_text) return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) {
    return Response.json({ error: "内容过长，请减少参考图片或清理画板后重试。" }, { status: 413 });
  }
  let input: CreativeAIInput;
  try {
    input = JSON.parse(raw) as CreativeAIInput;
  } catch {
    return Response.json({ error: "AI 输入格式无效。" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(await new DemoAIService().understand(input));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const textualContext = JSON.stringify({
      interestMap: input.interestMap,
      inspirationSources: input.inspirationSources.map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        detail: item.detail,
        hotspotId: item.hotspotId,
        marker: item.marker,
      })),
      keywords: input.keywords,
      notes: input.notes,
      studentNote: input.studentNote,
    });
    const content: Array<Record<string, unknown>> = [
      {
        type: "input_text",
        text: `你是青少年创意编程课程的意图整理助手。根据输入生成 JSON，不要替学生做最终决定。字段必须是 appIntent, audience, scenario, problem, coreFunctions, possibleInputs, possibleOutputs, visualStyle, uncertainties；数组字段输出字符串数组。输入：${textualContext}`,
      },
    ];
    if (input.sketchImage?.startsWith("data:image/")) {
      content.push({ type: "input_image", image_url: input.sketchImage, detail: "low" });
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CREATIVE_MODEL || "gpt-5-mini",
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "creative_intent",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                appIntent: { type: "string" },
                audience: { type: "string" },
                scenario: { type: "string" },
                problem: { type: "string" },
                coreFunctions: { type: "array", items: { type: "string" } },
                possibleInputs: { type: "array", items: { type: "string" } },
                possibleOutputs: { type: "array", items: { type: "string" } },
                visualStyle: { type: "string" },
                uncertainties: { type: "array", items: { type: "string" } },
              },
              required: [
                "appIntent", "audience", "scenario", "problem", "coreFunctions",
                "possibleInputs", "possibleOutputs", "visualStyle", "uncertainties",
              ],
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
    if (!response.ok) {
      throw new Error(payload.error?.message || "AI 请求失败");
    }
    const text = extractOutputText(payload);
    if (!text) throw new Error("AI 没有返回可用内容");
    const output = JSON.parse(text) as CreativeAIOutput;
    return Response.json({
      mode: "live",
      output,
      provenance: {
        provider: "openai",
        model: process.env.OPENAI_CREATIVE_MODEL || "gpt-5-mini",
        generatedAt: new Date().toISOString(),
        disclaimer: "Live AI 根据本次提交的文字与压缩画板图像生成草稿，最终内容由学生确认。",
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "AI 请求超时，请重试。"
      : error instanceof Error ? error.message : "AI 服务暂时不可用";
    return Response.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
