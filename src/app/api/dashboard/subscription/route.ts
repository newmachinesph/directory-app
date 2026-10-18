import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pro] = await db.select().from(professionals).where(eq(professionals.userId, session.user.id));
  if (!pro) return NextResponse.json({ professional: null, subscription: null });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.professionalId, pro.id));
  return NextResponse.json({ professional: pro, subscription: sub || null });
}
