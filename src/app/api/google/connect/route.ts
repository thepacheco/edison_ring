import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/auth";
import { getAuthUrl, googleConfigured } from "@/lib/google";

export const runtime = "nodejs";

/** Kick off Google Calendar OAuth — redirects to Google's consent screen. */
export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.redirect(new URL("/login", base()));
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/billing?error=google_unconfigured", base()));
  }
  return NextResponse.redirect(getAuthUrl(business.id));
}

function base() {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}
