import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If no webhook secret configured yet (pre-deployment), log and return OK
  if (!webhookSecret || !sig) {
    console.warn("Stripe webhook secret not configured");
    return NextResponse.json({ received: true });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const professionalId = session.metadata?.professionalId;
        if (professionalId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await db.update(subscriptions)
            .set({
              stripeSubscriptionId: sub.id,
              status: "active",
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.professionalId, professionalId));
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const professionalId = sub.metadata?.professionalId;
          if (professionalId) {
            await db.update(subscriptions)
              .set({
                status: "active",
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.professionalId, professionalId));
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const professionalId = sub.metadata?.professionalId;
          if (professionalId) {
            await db.update(subscriptions)
              .set({ status: "past_due", updatedAt: new Date() })
              .where(eq(subscriptions.professionalId, professionalId));
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const professionalId = sub.metadata?.professionalId;
        if (professionalId) {
          await db.update(subscriptions)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(subscriptions.professionalId, professionalId));
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
