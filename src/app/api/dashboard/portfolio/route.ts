import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { portfolioImages, professionals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pro] = await db.select({ id: professionals.id }).from(professionals)
    .where(eq(professionals.userId, session.user.id));
  if (!pro) return NextResponse.json({ images: [] });

  const images = await db.select().from(portfolioImages)
    .where(eq(portfolioImages.professionalId, pro.id))
    .orderBy(portfolioImages.sortOrder);
  return NextResponse.json({ images });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const imageId = req.nextUrl.searchParams.get("id");
  if (!imageId) return NextResponse.json({ error: "No image ID" }, { status: 400 });

  const [pro] = await db.select({ id: professionals.id }).from(professionals)
    .where(eq(professionals.userId, session.user.id));
  if (!pro) return NextResponse.json({ error: "No profile" }, { status: 404 });

  // Verify image belongs to this professional
  const [img] = await db.select().from(portfolioImages)
    .where(eq(portfolioImages.id, imageId));
  if (!img || img.professionalId !== pro.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await db.delete(portfolioImages).where(eq(portfolioImages.id, imageId));
  return NextResponse.json({ success: true });
}
