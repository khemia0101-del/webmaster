import { NextRequest, NextResponse } from "next/server";
import { renderCelinaCommand } from "@/lib/celina-commands";
import { recordEvent, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const secret = process.env.CELINA_COMMAND_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { command?: string; actor?: string };
  const command = body.command || "/today";
  const actor = body.actor || "CelinaAmenBot";

  await recordEvent({
    kind: "telegram_command",
    eventType: "telegram_command",
    source: "Telegram",
    actor,
    label: command,
    outcome: "command_received",
    confidence: 1,
    riskLevel: "low"
  });

  const store = await getStore();
  return NextResponse.json({
    ok: true,
    command,
    reply: renderCelinaCommand(command, store)
  });
}
