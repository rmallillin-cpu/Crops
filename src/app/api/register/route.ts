import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerUser } from "@/lib/sheets";
import { getLguBySlug } from "@/lib/lgus";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const lguSlug = String(body.lguSlug || "").trim();

    if (!name || !email || !password || !lguSlug) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!getLguBySlug(lguSlug)) {
      return NextResponse.json({ error: "Select a valid city/municipality." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await registerUser({ email, name, lguSlug, passwordHash });

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err: any) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Could not complete registration." }, { status: 500 });
  }
}
