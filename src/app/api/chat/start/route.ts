import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  const agent = await db.agent.create({ data: {} });
  const draft = await db.websiteDraft.create({ data: { agentId: agent.id } });
  const session = await db.chatSession.create({
    data: {
      agentId: agent.id,
      websiteId: draft.id,
      transcript: []
    }
  });

  return NextResponse.json({
    sessionId: session.id,
    websiteId: draft.id,
    agentId: agent.id,
    welcomeMessage: "Welcome! I will ask 7 quick questions to build your website."
  });
}
