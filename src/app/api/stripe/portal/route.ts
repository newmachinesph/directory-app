import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, professionals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [pro] = await db.select().from(professionals)
    .where(eq(professionals.userId, session.user.id));
  if (!pro) return NextResponse.json({ error: "No professional found" }, { status: 404 });

  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.professionalId, pro.id));
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/subscription`,
  });

  return NextResponse.json({ url: portalSession.url });
}
