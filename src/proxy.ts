import { NextResponse, type NextRequest } from "next/server";
import { getExperiment } from "@/lib/experiments";
import { requireAdmin } from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin") ||
    request.nextUrl.pathname.startsWith("/api/approvals") ||
    request.nextUrl.pathname.startsWith("/api/export") ||
    request.nextUrl.pathname === "/api/celina/loop"
  ) {
    const denied = requireAdmin(request);
    if (denied) return denied;
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (request.nextUrl.pathname !== "/") return NextResponse.next();

  const experiment = getExperiment("home-hero-v1");
  if (!experiment || experiment.status !== "active") return NextResponse.next();

  const existing = request.cookies.get("co_home_hero_variant")?.value;
  const validExisting = experiment.variants.some((variant) => variant.id === existing);

  const bucket = Math.floor(Math.random() * 100);
  let cursor = 0;
  const selected =
    experiment.variants.find((variant) => {
      cursor += variant.weight;
      return bucket < cursor;
    }) ?? experiment.variants[0];

  const response = NextResponse.next();
  response.cookies.set("co_home_hero_variant", validExisting ? existing! : selected.id, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax", path: "/", secure: request.nextUrl.protocol === "https:"
  });
  if (!/^[0-9a-f-]{36}$/.test(request.cookies.get("co_visitor")?.value ?? "")) {
    response.cookies.set("co_visitor", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24 * 30, sameSite: "lax", path: "/", httpOnly: true,
      secure: request.nextUrl.protocol === "https:"
    });
  }
  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/api/approvals/:path*", "/api/export/:path*", "/api/celina/loop"]
};
