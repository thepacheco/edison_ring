import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

const COOKIE = "edison_session";
const ADMIN_COOKIE = "edison_admin";

function secret(): string {
  return process.env.NEXTAUTH_SECRET || "dev-insecure-secret-change-me";
}

// --- password hashing (scrypt, no external deps) ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}

// --- signed session cookie ---

function sign(value: string): string {
  const mac = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${mac}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("hex");
  if (
    mac.length === expected.length &&
    timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  ) {
    return value;
  }
  return null;
}

export async function createSession(businessId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sign(businessId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Resolve the signed-in business. In a fresh dev environment with no session,
 * falls back to the first business so the dashboard is usable without auth.
 */
export async function getCurrentBusiness(): Promise<Business | null> {
  try {
    const jar = await cookies();
    const businessId = unsign(jar.get(COOKIE)?.value);
    if (businessId) {
      const b = await prisma.business.findUnique({ where: { id: businessId } });
      if (b) return b;
    }
    return await prisma.business.findFirst();
  } catch {
    return null;
  }
}

// --- admin (CEO) gate: a single env-configured password ---

export async function createAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies();
    return unsign(jar.get(ADMIN_COOKIE)?.value) === "admin";
  } catch {
    return false;
  }
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return (
    password.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected))
  );
}
