import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processStep } from "@/lib/chat/processor";

type ReqBody = { sessionId: string; message: string };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReqBody;
  const session = await db.chatSession.findUnique({ where: { id: body.sessionId } });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const transcript = [...((session.transcript as Array<{ role: "user" | "assistant"; content: string }>) ?? []), { role: "user" as const, content: body.message }];
  const result = await processStep(session.currentStep, transcript);

  const nextStep = result.shouldAdvance ? Math.min(session.currentStep + 1, 7) : session.currentStep;
  const updatedTranscript = [...transcript, { role: "assistant" as const, content: result.reply }];

  await db.chatSession.update({
    where: { id: session.id },
    data: {
      currentStep: nextStep,
      transcript: updatedTranscript
    }
  });

  return NextResponse.json({
    reply: result.reply,
    currentStep: nextStep,
    totalSteps: 7,
    extractedData: result.extractedFields,
    previewReady: nextStep >= 2
  });
}
