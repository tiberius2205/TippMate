import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin/resolve")) {
    return NextResponse.next();
  }

  const pw = request.nextUrl.searchParams.get("pw");
  const validPw = process.env.ADMIN_PASSWORD ?? "wm2026admin";

  if (pw === validPw) {
    const response = NextResponse.next();
    response.headers.set("x-admin-auth", pw);
    // Passwort aus URL entfernen, in Cookie speichern
    const clean = new URL(request.url);
    clean.searchParams.delete("pw");
    const res = NextResponse.redirect(clean);
    res.cookies.set("admin_auth", pw, { httpOnly: true, sameSite: "strict", path: "/admin" });
    return res;
  }

  // Cookie-Auth prüfen
  const cookie = request.cookies.get("admin_auth")?.value;
  if (cookie === validPw) {
    const response = NextResponse.next();
    response.headers.set("x-admin-auth", cookie);
    return response;
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/resolve"],
};
