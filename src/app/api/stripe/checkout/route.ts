import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, getOrCreatePrice } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, professionals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { tier, professionalId } = await req.json();
  if (!tier || !professionalId) {
    return NextResponse.json({ error: "Missing tier or professionalId" }, { status: 400 });
  }

  // Verify professional belongs to this user
  const [pro] = await db.select().from(professionals)
    .where(eq(professionals.id, professionalId));
  if (!pro || pro.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const [existingSub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.professionalId, professionalId));

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      metadata: { professionalId, userId: session.user.id },
    });
    stripeCustomerId = customer.id;
  }

  const priceId = await getOrCreatePrice(tier as "basic" | "professional" | "elite");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${baseUrl}/dashboard?success=1`,
    cancel_url: `${baseUrl}/join`,
    metadata: { professionalId, tier },
    subscription_data: { metadata: { professionalId, tier } },
  });

  // Upsert subscription record
  if (existingSub) {
    await db.update(subscriptions)
      .set({ stripeCustomerId, stripePriceId: priceId, updatedAt: new Date() })
      .where(eq(subscriptions.id, existingSub.id));
  } else {
    await db.insert(subscriptions).values({
      professionalId,
      stripeCustomerId,
      stripePriceId: priceId,
      status: "incomplete",
    });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
