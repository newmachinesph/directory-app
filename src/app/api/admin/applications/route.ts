import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals, applications, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { professionalId, applicationId, action, notes } = await req.json();

  if (action === "approve") {
    // Update professional status
    await db.update(professionals)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(professionals.id, professionalId));

    // Update application
    await db.update(applications)
      .set({ status: "approved", notes, reviewedBy: session.user.id, reviewedAt: new Date() })
      .where(eq(applications.id, applicationId));

    // Create active subscription (free trial for demo - in production they'd pay first)
    const [existingSub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.professionalId, professionalId));
    if (!existingSub) {
      await db.insert(subscriptions).values({
        professionalId,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    } else if (existingSub.status !== "active") {
      await db.update(subscriptions)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(subscriptions.id, existingSub.id));
    }
  } else {
    await db.update(professionals)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(professionals.id, professionalId));
    await db.update(applications)
      .set({ status: "rejected", notes, reviewedBy: session.user.id, reviewedAt: new Date() })
      .where(eq(applications.id, applicationId));
  }

  return NextResponse.json({ success: true });
}
