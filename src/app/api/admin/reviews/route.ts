import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { reviewId, action } = await req.json();
  if (action === "approve") {
    await db.update(reviews).set({ isApproved: true }).where(eq(reviews.id, reviewId));
  } else {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
  }
  return NextResponse.json({ success: true });
}
