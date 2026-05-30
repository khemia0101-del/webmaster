import { NextResponse } from "next/server";
import { exportLeadsCsv } from "@/lib/store";

export async function GET() {
  const timestamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(await exportLeadsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conquistador-leads-${timestamp}.csv"`
    }
  });
}
