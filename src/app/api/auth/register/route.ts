import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 12);
  try {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: hash, role: "professional" })
      .returning({ id: users.id, email: users.email });
    return NextResponse.json({ id: user.id });
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }
}
