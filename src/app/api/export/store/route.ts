import { NextResponse } from "next/server";
import { exportStoreJson } from "@/lib/store";

export async function GET() {
  const timestamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(await exportStoreJson(), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="conquistador-store-${timestamp}.json"`
    }
  });
}
