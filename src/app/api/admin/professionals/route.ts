import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { professionalId, status } = await req.json();
  await db.update(professionals).set({ status, updatedAt: new Date() }).where(eq(professionals.id, professionalId));
  return NextResponse.json({ success: true });
}
