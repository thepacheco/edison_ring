"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getCurrentBusiness,
  createAdminSession,
  checkAdminPassword,
} from "@/lib/auth";
import { planFor } from "@/lib/pricing";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("businessName") || "").trim();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const plan = String(formData.get("plan") || "standard");

  if (!email || !password || !name) {
    redirect("/signup?error=missing");
  }

  const existing = await prisma.business.findUnique({ where: { ownerEmail: email } });
  if (existing) redirect("/signup?error=exists");

  // Assign the configured Edison number if free, else a placeholder to be set
  // during setup (each business needs its own provisioned number).
  const envNumber = process.env.TWILIO_PHONE_NUMBER;
  let twilioNumber = envNumber || `pending-${randomUUID()}`;
  if (envNumber) {
    const taken = await prisma.business.findUnique({
      where: { twilioNumber: envNumber },
    });
    if (taken) twilioNumber = `pending-${randomUUID()}`;
  }

  const p = planFor(plan);
  const business = await prisma.business.create({
    data: {
      name,
      ownerEmail: email,
      passwordHash: hashPassword(password),
      phoneNumber: phoneNumber || "",
      twilioNumber,
      plan: p.id,
      conversationLimit: p.includedConversations,
      foundingLockedAt: p.id === "founding" ? new Date() : null,
    },
  });

  await createSession(business.id);
  redirect("/billing?welcome=1");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const business = await prisma.business.findUnique({ where: { ownerEmail: email } });
  if (!business?.passwordHash || !verifyPassword(password, business.passwordHash)) {
    redirect("/login?error=invalid");
  }
  await createSession(business!.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateSettingsAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const avgTicket = Number(formData.get("avgTicketPrice"));
  const routingMode = String(formData.get("routingMode") || business!.routingMode);
  const greeting = String(formData.get("greeting") || "");
  const voice = String(formData.get("voice") || "friendly");

  await prisma.business.update({
    where: { id: business!.id },
    data: {
      avgTicketPrice: Number.isFinite(avgTicket) ? avgTicket : business!.avgTicketPrice,
      routingMode,
      aiToneSettings: { greeting: greeting || undefined, voice },
    },
  });
  redirect("/settings?saved=1");
}

export async function toggleWorkerAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const workerId = String(formData.get("workerId"));
  const worker = await prisma.worker.findFirst({
    where: { id: workerId, businessId: business!.id },
  });
  if (worker) {
    await prisma.worker.update({
      where: { id: worker.id },
      data: { isAvailable: !worker.isAvailable },
    });
  }
  redirect("/settings");
}

export async function startCheckoutAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const { stripe, stripeConfigured, priceIdFor } = await import("@/lib/stripe");
  const { planFor, TRIAL_DAYS } = await import("@/lib/pricing");

  if (!stripeConfigured()) redirect("/billing?error=stripe_unconfigured");

  const plan = planFor(String(formData.get("plan") || business!.plan));
  const base = process.env.APP_BASE_URL || "http://localhost:3000";

  // Reuse or create a Stripe customer.
  let customerId = business!.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: business!.ownerEmail,
      name: business!.name,
      metadata: { businessId: business!.id },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: business!.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const configuredPrice = priceIdFor(plan.id);
  const lineItem = configuredPrice
    ? { price: configuredPrice, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          product_data: { name: `Edison — ${plan.name}` },
          unit_amount: plan.monthly * 100,
          recurring: { interval: "month" as const },
        },
        quantity: 1,
      };

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [lineItem],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { businessId: business!.id, plan: plan.id },
    },
    payment_method_collection: "always", // card required up front
    success_url: `${base}/billing?checkout=success`,
    cancel_url: `${base}/billing?checkout=cancel`,
  });

  await prisma.business.update({
    where: { id: business!.id },
    data: { plan: plan.id, conversationLimit: plan.includedConversations },
  });

  redirect(session.url!);
}

export async function billingPortalAction() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const { stripe, stripeConfigured } = await import("@/lib/stripe");
  if (!stripeConfigured() || !business!.stripeCustomerId) {
    redirect("/billing?error=no_customer");
  }
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const portal = await stripe().billingPortal.sessions.create({
    customer: business!.stripeCustomerId!,
    return_url: `${base}/billing`,
  });
  redirect(portal.url);
}

export async function saveCarrierAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const carrier = String(formData.get("carrier") || "");
  await prisma.business.update({
    where: { id: business!.id },
    data: { carrier },
  });
  redirect("/setup?step=2");
}

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!checkAdminPassword(password)) redirect("/admin/login?error=invalid");
  await createAdminSession();
  redirect("/admin");
}
