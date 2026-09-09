/** Edge-compatible; shared by middleware and sensitive route handlers. */
export function adminAuthorized(request: Request, env: Readonly<Record<string, string | undefined>> = process.env) {
  const user = env.ADMIN_USERNAME;
  const pass = env.ADMIN_PASSWORD;
  if (!user || !pass) return env.NODE_ENV !== "production" && !env.VERCEL;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    return separator >= 0 && decoded.slice(0, separator) === user && decoded.slice(separator + 1) === pass;
  } catch {
    return false;
  }
}

export function requireAdmin(request: Request) {
  if (adminAuthorized(request)) return null;
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Conquistador Oil Admin"', "Cache-Control": "no-store" }
  });
}
