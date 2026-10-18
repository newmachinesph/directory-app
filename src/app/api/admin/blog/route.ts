import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { title, slug, excerpt, body, author, coverImage, publish } = await req.json();
  const [post] = await db.insert(blogPosts).values({
    title, slug, excerpt, body, author,
    coverImage: coverImage || null,
    publishedAt: publish ? new Date() : null,
  }).returning();
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { postId, action, title, slug, excerpt, body, author, coverImage, publish } = await req.json();

  if (action === "publish") {
    await db.update(blogPosts).set({ publishedAt: new Date(), updatedAt: new Date() }).where(eq(blogPosts.id, postId));
  } else if (action === "unpublish") {
    await db.update(blogPosts).set({ publishedAt: null, updatedAt: new Date() }).where(eq(blogPosts.id, postId));
  } else {
    await db.update(blogPosts).set({
      title, slug, excerpt, body, author,
      coverImage: coverImage || null,
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(blogPosts.id, postId));
  }
  return NextResponse.json({ success: true });
}
