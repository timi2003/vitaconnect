// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Doctor-only routes
    if (pathname.startsWith("/doctor-portal") && token?.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/appointments/:path*",
    "/health-data/:path*",
    "/doctors/:path*",
    "/messages/:path*",
    "/prescriptions/:path*",
    "/lab-results/:path*",
    "/records/:path*",
    "/profile/:path*",
    "/video/:path*",
    "/doctor-portal/:path*",
    "/admin/:path*",
  ],
};