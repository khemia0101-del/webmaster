import { NextResponse } from "next/server";
import {
  capturePhoneInquiry,
  destinationForInboundCall,
  NoTransferDestinationError,
  recordCallEnd,
  recordContractorLeadResponse,
  recordTransferUpdate
} from "@/lib/phone-operations";
import { buildInboundAssistant, vapiWebhookAuthorized } from "@/lib/vapi";

export const runtime = "nodejs";
export const preferredRegion = "sfo1";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type ToolCall = {
  id?: string;
  name?: string;
  parameters?: Record<string, unknown> | string;
};

type VapiMessage = Record<string, unknown> & {
  type?: string;
  call?: {
    id?: string;
    customer?: { number?: string };
    metadata?: Record<string, unknown>;
  };
  toolCallList?: ToolCall[];
  toolWithToolCallList?: Array<{ name?: string; toolCall?: ToolCall }>;
};

function toolCalls(message: VapiMessage) {
  const direct = Array.isArray(message.toolCallList) ? message.toolCallList : [];
  if (direct.length) return direct.slice(0, 5);
  return (Array.isArray(message.toolWithToolCallList) ? message.toolWithToolCallList : [])
    .map((entry) => ({ ...entry.toolCall, name: entry.name || entry.toolCall?.name }))
    .slice(0, 5);
}

function parameters(call: ToolCall) {
  if (call.parameters && typeof call.parameters === "object") return call.parameters;
  if (typeof call.parameters === "string") {
    try {
      const parsed = JSON.parse(call.parameters) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

async function handleToolCalls(message: VapiMessage) {
  const results = [];
  for (const toolCall of toolCalls(message)) {
    const toolCallId = String(toolCall.id || "");
    const name = String(toolCall.name || "");
    try {
      let value: unknown;
      if (name === "save_phone_inquiry") {
        value = await capturePhoneInquiry(message.call ?? {}, parameters(toolCall));
      } else if (name === "record_contractor_lead_response") {
        value = await recordContractorLeadResponse(message.call ?? {}, parameters(toolCall));
      } else {
        throw new Error("Unsupported tool call.");
      }
      results.push({ name, toolCallId, result: JSON.stringify(value) });
    } catch (error) {
      results.push({
        name,
        toolCallId,
        error: error instanceof Error ? error.message.replace(/[\r\n]+/g, " ").slice(0, 240) : "Tool failed."
      });
    }
  }
  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  if (!vapiWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let message: VapiMessage;
  try {
    const payload = (await request.json()) as { message?: VapiMessage };
    if (!payload.message || typeof payload.message !== "object") {
      return NextResponse.json({ error: "Invalid Vapi payload." }, { status: 400 });
    }
    message = payload.message;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  switch (message.type) {
    case "assistant-request":
      return NextResponse.json({ assistant: buildInboundAssistant(request.url) });
    case "tool-calls":
      return handleToolCalls(message);
    case "transfer-destination-request":
      try {
        return NextResponse.json(await destinationForInboundCall(message.call ?? {}));
      } catch (error) {
        const detail =
          error instanceof NoTransferDestinationError
            ? error.message
            : "The transfer destination could not be selected. The lead remains saved.";
        return NextResponse.json({ error: detail });
      }
    case "transfer-update":
      await recordTransferUpdate(message.call ?? {}, message);
      return NextResponse.json({ received: true });
    case "end-of-call-report":
      await recordCallEnd(message.call ?? {}, message);
      return NextResponse.json({ received: true });
    default:
      return NextResponse.json({ received: true });
  }
}
