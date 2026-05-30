import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "conquistador-oil-mvp",
    timestamp: new Date().toISOString()
  });
}
