import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const slug = `demo-${nanoid(6)}`;

  await db.websiteDraft.update({
    where: { id: websiteId },
    data: { status: "published", demoUrl: slug }
  });

  return NextResponse.json({ url: `/sites/${slug}` });
}
