import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { spaceFromHost, spaceOrigin } from "@/lib/hosts";
import { resolveHostRoute } from "@/lib/host-routing";

function carrySession(session: NextResponse, response: NextResponse) {
  for (const cookie of session.cookies.getAll()) response.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = session.headers.get(header);
    if (value) response.headers.set(header, value);
  }
  return response;
}

function applyIndexingPolicy(response: NextResponse, space: "www" | "app" | "team" | "admin", pathname: string) {
  if (space !== "www") response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (space === "www" && (pathname.startsWith("/invite/") || pathname === "/auth/accept-invite")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const incomingHost = request.headers.get("host")?.toLowerCase().replace(/\.$/, "") ?? "";
  const pathname = request.nextUrl.pathname;
  let space = spaceFromHost(incomingHost);
  const vercelProductionHosts = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
    .map((host) => host?.toLowerCase())
    .filter((host): host is string => Boolean(host));
  const isProductionCronHost = process.env.VERCEL_ENV === "production"
    && pathname.startsWith("/api/cron/")
    && vercelProductionHosts.includes(incomingHost);
  if (!space && isProductionCronHost) space = "www";
  if (!space) return applyIndexingPolicy(new NextResponse("Not Found", { status: 404 }), "www", pathname);

  // Canonicalize the old Vercel alias without changing the active dev domain.
  if (incomingHost === "studio-plus-pink.vercel.app") {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, spaceOrigin("www")), 308);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let sessionResponse = NextResponse.next({ request });

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          sessionResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => sessionResponse.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getClaims();
  }

  // Keep the existing single-host app and callback endpoints intact during the migration.
  if (incomingHost === "dev.studioplusci.com" || incomingHost === "localhost:3000") return sessionResponse;

  const { search } = request.nextUrl;
  if (/\.(?:css|js|mjs|map|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$/i.test(pathname)) return applyIndexingPolicy(sessionResponse, space, pathname);
  const resolved = resolveHostRoute(space, pathname);
  if (resolved.type === "pass") return applyIndexingPolicy(sessionResponse, space, pathname);

  if (resolved.type === "redirect") {
    const target = `${resolved.pathname}${search}`;
    const response = NextResponse.redirect(new URL(target, spaceOrigin(resolved.space)), 307);
    return applyIndexingPolicy(carrySession(sessionResponse, response), space, pathname);
  }

  if (resolved.type === "not-found") {
    return applyIndexingPolicy(carrySession(sessionResponse, new NextResponse("Not Found", { status: 404 })), space, pathname);
  }

  const rewritten = request.nextUrl.clone();
  rewritten.pathname = resolved.pathname;
  return applyIndexingPolicy(carrySession(sessionResponse, NextResponse.rewrite(rewritten, { request })), space, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
