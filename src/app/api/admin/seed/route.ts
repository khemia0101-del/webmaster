import { NextResponse } from "next/server";
import { seedDatabase, supabaseConfigured } from "@/lib/supabase";

/**
 * One-time database seed for production. Protected by SEED_TOKEN so it can't be
 * triggered by the public. Call once after creating the Supabase project:
 *
 *   curl -X POST https://conquistadoroil.com/api/admin/seed \
 *philadelphia     -H "Authorization: Bearer <SEED_TOKEN>"
 *
 * Idempotent (upsert on id), so re-running won't duplicate rows.
 */
export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const token = process.env.SEED_TOKEN;
  const auth = request.headers.get("authorization") || "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  if (!token || provided !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed." },
      { status: 500 }
    );
  }
}
