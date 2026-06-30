import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCode } from "@/lib/google";

export const runtime = "nodejs";

/** Google OAuth callback — persists the refresh token to the business. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const businessId = url.searchParams.get("state");
  const b = process.env.APP_BASE_URL || "http://localhost:3000";

  if (!code || !businessId) {
    return NextResponse.redirect(new URL("/billing?error=google_failed", b));
  }

  try {
    const { refreshToken } = await exchangeCode(code);
    if (refreshToken) {
      await prisma.business.update({
        where: { id: businessId },
        data: { googleRefreshToken: refreshToken },
      });
    }
    return NextResponse.redirect(new URL("/billing?google=connected", b));
  } catch (err) {
    console.error("Google OAuth exchange failed:", err);
    return NextResponse.redirect(new URL("/billing?error=google_failed", b));
  }
}
