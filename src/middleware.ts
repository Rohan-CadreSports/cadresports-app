import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for the auth session cookie (NextAuth v5 uses __Secure-authjs prefix on HTTPS)
  const hasSession =
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("next-auth.session-token");

  if (!hasSession) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile"],
};
