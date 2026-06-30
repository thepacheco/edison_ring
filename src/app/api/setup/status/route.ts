import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/auth";

export const runtime = "nodejs";

/** Polled by the setup wizard to flip the live-test indicator green. */
export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ setupCompleted: false });
  return NextResponse.json({
    setupCompleted: business.setupCompleted,
    twilioNumber: business.twilioNumber,
  });
}
