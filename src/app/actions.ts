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
  getCurrentUser,
  createAdminSession,
  checkAdminPassword,
  makeResetToken,
  hashResetToken,
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

  const existingBiz = await prisma.business.findUnique({ where: { ownerEmail: email } });
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingBiz || existingUser) redirect("/signup?error=exists");

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
  const user = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name,
        ownerEmail: email,
        phoneNumber: phoneNumber || "",
        twilioNumber,
        plan: p.id,
        conversationLimit: p.includedConversations,
        foundingLockedAt: p.id === "founding" ? new Date() : null,
      },
    });
    return tx.user.create({
      data: {
        businessId: business.id,
        email,
        name,
        passwordHash: hashPassword(password),
        role: "owner",
      },
    });
  });

  await createSession(user.id);
  redirect("/billing?welcome=1");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }
  await createSession(user!.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// --- account (current user) ---

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (email && email !== user!.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) redirect("/settings/account?error=email_taken");
  }
  await prisma.user.update({
    where: { id: user!.id },
    data: { name: name || user!.name, email: email || user!.email },
  });
  redirect("/settings/account?saved=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  if (!verifyPassword(current, user!.passwordHash)) {
    redirect("/settings/account?error=wrong_password");
  }
  if (next.length < 8) redirect("/settings/account?error=weak_password");
  await prisma.user.update({
    where: { id: user!.id },
    data: { passwordHash: hashPassword(next) },
  });
  redirect("/settings/account?saved=pw");
}

// --- team (owner only) ---

export async function addUserAction(formData: FormData) {
  const owner = await getCurrentUser();
  if (owner?.role !== "owner") redirect("/settings/team?error=forbidden");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "staff");
  const password = String(formData.get("password") || "");
  const isTest = formData.get("isTest") === "on";
  if (!name || !email || password.length < 8) {
    redirect("/settings/team?error=missing");
  }
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) redirect("/settings/team?error=email_taken");
  await prisma.user.create({
    data: {
      businessId: owner!.businessId,
      name,
      email,
      role: role === "owner" ? "owner" : "staff",
      passwordHash: hashPassword(password),
      isTest,
    },
  });
  redirect("/settings/team?saved=added");
}

export async function updateUserAction(formData: FormData) {
  const owner = await getCurrentUser();
  if (owner?.role !== "owner") redirect("/settings/team?error=forbidden");
  const userId = String(formData.get("userId"));
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "staff");
  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: owner!.businessId },
  });
  if (!target) redirect("/settings/team");
  await prisma.user.update({
    where: { id: target.id },
    data: { name: name || target.name, role: role === "owner" ? "owner" : "staff" },
  });
  redirect("/settings/team?saved=updated");
}

export async function removeUserAction(formData: FormData) {
  const owner = await getCurrentUser();
  if (owner?.role !== "owner") redirect("/settings/team?error=forbidden");
  const userId = String(formData.get("userId"));
  if (userId === owner!.id) redirect("/settings/team?error=self");
  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: owner!.businessId },
  });
  if (target) {
    // Never remove the last owner.
    const owners = await prisma.user.count({
      where: { businessId: owner!.businessId, role: "owner" },
    });
    if (target.role === "owner" && owners <= 1) {
      redirect("/settings/team?error=last_owner");
    }
    await prisma.user.delete({ where: { id: target.id } });
  }
  redirect("/settings/team?saved=removed");
}

// --- password reset ---

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, tokenHash } = makeResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });
    const base = process.env.APP_BASE_URL || "http://localhost:3000";
    const link = `${base}/reset?token=${token}`;
    const { emailConfigured, sendEmail } = await import("@/lib/email");
    if (emailConfigured()) {
      try {
        await sendEmail({
          to: email,
          subject: "Reset your Edison password",
          html: `<p>Click to reset your password (expires in 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`,
        });
      } catch (err) {
        console.error("reset email failed:", err);
      }
    } else {
      console.log("Password reset link (email not configured):", link);
    }
  }
  // Always report success (don't leak which emails exist).
  redirect("/forgot?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const next = String(formData.get("password") || "");
  if (next.length < 8) redirect(`/reset?token=${token}&error=weak`);
  const rec = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    redirect("/reset?error=invalid");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec!.userId },
      data: { passwordHash: hashPassword(next) },
    }),
    prisma.passwordResetToken.update({
      where: { id: rec!.id },
      data: { usedAt: new Date() },
    }),
  ]);
  redirect("/login?reset=1");
}

// --- test lead simulator (onboarding: prove the flow without a real phone) ---

export async function runTestLeadAction() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const { simulateTestLead } = await import("@/lib/conversation");
  try {
    const conversationId = await simulateTestLead(business!.id);
    redirect(`/conversations/${conversationId}?test=1`);
  } catch (err) {
    // redirect() throws internally; only log real failures.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("test lead failed:", err);
    redirect("/dashboard?test=error");
  }
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

export async function addWorkerAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const keywords = String(formData.get("keywords") || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  if (!name) redirect("/settings?error=worker_missing#workers");
  const count = await prisma.worker.count({ where: { businessId: business!.id } });
  await prisma.worker.create({
    data: {
      businessId: business!.id,
      name,
      phoneNumber,
      keywords,
      routingOrder: count + 1,
    },
  });
  redirect("/settings?saved=worker_added#workers");
}

export async function updateWorkerAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const workerId = String(formData.get("workerId"));
  const name = String(formData.get("name") || "").trim();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const keywords = String(formData.get("keywords") || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  const backupWorkerId = String(formData.get("backupWorkerId") || "") || null;
  const worker = await prisma.worker.findFirst({
    where: { id: workerId, businessId: business!.id },
  });
  if (worker) {
    await prisma.worker.update({
      where: { id: worker.id },
      data: { name: name || worker.name, phoneNumber, keywords, backupWorkerId },
    });
  }
  redirect("/settings?saved=worker_updated#workers");
}

export async function removeWorkerAction(formData: FormData) {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");
  const workerId = String(formData.get("workerId"));
  const worker = await prisma.worker.findFirst({
    where: { id: workerId, businessId: business!.id },
  });
  if (worker) {
    // Clear any backup references to this worker first.
    await prisma.worker.updateMany({
      where: { businessId: business!.id, backupWorkerId: worker.id },
      data: { backupWorkerId: null },
    });
    await prisma.worker.delete({ where: { id: worker.id } });
  }
  redirect("/settings?saved=worker_removed#workers");
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

export async function contactAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!name || !email || !message) redirect("/contact?sent=error");

  const { emailConfigured, sendEmail } = await import("@/lib/email");
  const to = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || "hello@edison.io";
  if (emailConfigured()) {
    try {
      await sendEmail({
        to,
        subject: `New contact from ${name}`,
        html: `<p><b>${name}</b> (${email}) wrote:</p><p>${message.replace(/</g, "&lt;")}</p>`,
      });
    } catch (err) {
      console.error("contact email failed:", err);
    }
  } else {
    console.log("Contact form (email not configured):", { name, email, message });
  }
  redirect("/contact?sent=ok");
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
