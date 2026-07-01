import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

export const runtime = "nodejs";

/** Persist the owner's selected carrier (called from the setup wizard). */
export async function POST(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ ok: false }, { status: 401 });
  const { carrier } = (await req.json()) as { carrier?: string };
  await prisma.business.update({
    where: { id: business.id },
    data: { carrier: carrier || null },
  });
  return NextResponse.json({ ok: true });
}
