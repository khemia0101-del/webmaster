import { captureContractorOutreach } from "@/lib/contractor-outreach";
import { vapiOutboundWebhookAuthorized } from "@/lib/vapi-outbound";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type ToolCall = {
  id?: string;
  name?: string;
  arguments?: Record<string, unknown> | string;
  parameters?: Record<string, unknown> | string;
  function?: {
    name?: string;
    parameters?: Record<string, unknown> | string;
  };
};

type VapiMessage = Record<string, unknown> & {
  type?: string;
  call?: {
    id?: string;
    metadata?: Record<string, unknown>;
  };
  toolCallList?: ToolCall[];
  toolWithToolCallList?: Array<{ name?: string; toolCall?: ToolCall }>;
};

function toolCalls(message: VapiMessage) {
  const direct = Array.isArray(message.toolCallList) ? message.toolCallList : [];
  if (direct.length) return direct.slice(0, 3);
  return (Array.isArray(message.toolWithToolCallList) ? message.toolWithToolCallList : [])
    .map((entry) => ({
      ...entry.toolCall,
      name: entry.name || entry.toolCall?.name || entry.toolCall?.function?.name
    }))
    .slice(0, 3);
}
function parseParameters(value: ToolCall["parameters"]) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function parameters(call: ToolCall) {
  return parseParameters(call.arguments ?? call.parameters ?? call.function?.parameters);
}

async function handleToolCalls(message: VapiMessage) {
  const results = [];
  for (const toolCall of toolCalls(message)) {
    const toolCallId = String(toolCall.id || "");
    const name = String(toolCall.name || toolCall.function?.name || "");
    try {
      if (name !== "save_contractor_outreach") throw new Error("Unsupported tool call.");
      const value = await captureContractorOutreach(message.call ?? {}, parameters(toolCall));
      results.push({ name, toolCallId, result: JSON.stringify(value) });
    } catch (error) {
      results.push({
        name,
        toolCallId,
        error: error instanceof Error
          ? error.message.replace(/[\r\n]+/g, " ").slice(0, 240)
          : "Tool failed."
      });
    }
  }
  return Response.json({ results });
}

export async function POST(request: Request) {
  if (!vapiOutboundWebhookAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let message: VapiMessage;
  try {
    const payload = (await request.json()) as { message?: VapiMessage };
    if (!payload.message || typeof payload.message !== "object") {
      return Response.json({ error: "Invalid Vapi payload." }, { status: 400 });
    }
    message = payload.message;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (message.type === "tool-calls") return handleToolCalls(message);
  return Response.json({ received: true });
}
