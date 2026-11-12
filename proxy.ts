import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, readToken } from "@/cms/auth/token";

/**
 * Route guard for the student and tutor portals and their APIs.
 *
 * This is an optimistic check (token signature, expiry and role). Every page and API route still
 * authenticates through Payload, which also validates the server-side session.
 * The Payload admin (/admin) and Payload's REST API protect themselves.
 */
const STAFF = new Set(["admin", "manager", "finance", "support", "editor"]);

const AREAS: { prefix: string; roles: Set<string> }[] = [
  { prefix: "/student", roles: new Set(["student", ...STAFF]) },
  { prefix: "/tutor", roles: new Set(["tutor", ...STAFF]) },
  { prefix: "/api/student", roles: new Set(["student", ...STAFF]) },
  { prefix: "/api/tutor", roles: new Set(["tutor", ...STAFF]) },
];

const homeFor = (role?: string) => (role === "tutor" ? "/tutor" : role === "student" ? "/student" : role && STAFF.has(role) ? "/admin" : "/login");

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const claims = await readToken(request.cookies.get(COOKIE)?.value);

  if (!claims) {
    if (isApi) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (claims.status && claims.status !== "active") {
    if (isApi) return NextResponse.json({ error: "This account is not active." }, { status: 403 });
    return NextResponse.redirect(new URL("/login?error=inactive", request.url));
  }

  if (!area.roles.has(String(claims.role))) {
    if (isApi) return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
    return NextResponse.redirect(new URL(homeFor(claims.role), request.url));
  }

  const res = NextResponse.next();
  res.headers.set("X-Auth-User-Id", String(claims.id));
  res.headers.set("X-User-Role", String(claims.role));
  return res;
}

export const config = {
  matcher: [
    "/student/:path*",
    "/tutor/:path*",
    "/api/student/:path*",
    "/api/tutor/:path*",
  ],
};
