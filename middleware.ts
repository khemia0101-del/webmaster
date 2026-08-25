import { NextResponse, type NextRequest } from "next/server";
import { getExperiment } from "@/lib/experiments";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Conquistador Oil Admin"'
    }
  });
}

function adminAuthOk(request: NextRequest) {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  const decoded = atob(header.slice("Basic ".length));
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;
  return decoded.slice(0, separator) === user && decoded.slice(separator + 1) === pass;
}

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin") ||
    request.nextUrl.pathname.startsWith("/api/approvals") ||
    request.nextUrl.pathname.startsWith("/api/export")
  ) {
    if (!adminAuthOk(request)) return unauthorized();
    return NextResponse.next();
  }

  if (request.nextUrl.pathname !== "/") return NextResponse.next();

  const experiment = getExperiment("home-hero-v1");
  if (!experiment || experiment.status !== "active") return NextResponse.next();

  const existing = request.cookies.get("co_home_hero_variant")?.value;
  if (existing && experiment.variants.some((variant) => variant.id === existing)) {
    return NextResponse.next();
  }

  const bucket = Math.floor(Math.random() * 100);
  let cursor = 0;
  const selected =
    experiment.variants.find((variant) => {
      cursor += variant.weight;
      return bucket < cursor;
    }) ?? experiment.variants[0];

  const response = NextResponse.next();
  response.cookies.set("co_home_hero_variant", selected.id, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax"
  });
  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/api/approvals/:path*", "/api/export/:path*"]
};
