import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, professionals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { professionalId, reviewerName, reviewerEmail, rating, body } = await req.json();

  if (!professionalId || !reviewerName || !rating || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  if (body.length < 20) {
    return NextResponse.json({ error: "Review too short" }, { status: 400 });
  }

  // Verify professional exists and is approved
  const [pro] = await db.select({ id: professionals.id }).from(professionals)
    .where(eq(professionals.id, professionalId));
  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  await db.insert(reviews).values({
    professionalId,
    reviewerName: reviewerName.trim(),
    reviewerEmail: reviewerEmail?.trim(),
    rating,
    body: body.trim(),
    isApproved: false, // requires admin approval
  });

  return NextResponse.json({ success: true, message: "Review submitted for approval" });
}
