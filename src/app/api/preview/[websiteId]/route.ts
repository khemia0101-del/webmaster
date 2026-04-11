import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const html = `<!doctype html><html><body style="font-family:Arial;padding:24px"><h1>Preview for ${websiteId}</h1><p>Your generated site preview will appear here.</p></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
