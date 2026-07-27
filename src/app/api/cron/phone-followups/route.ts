import { NextResponse } from "next/server";
import { processDuePhoneFollowUps } from "@/lib/phone-operations";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (process.env.VERCEL && !supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is required for durable phone follow-up queues on Vercel." },
      { status: 503 }
    );
  }

  try {
    const result = await processDuePhoneFollowUps();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Phone follow-up processing failed." }, { status: 500 });
  }
}
