import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllowedUsers, updateAllowedUser } from "@/lib/sheets";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  try {
    const users = await getAllowedUsers();
    // Never send password hashes to the client.
    const safe = users.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({ ok: true, users: safe });
  } catch (err: any) {
    console.error("admin users list error:", err);
    return NextResponse.json({ error: "Could not load users from Google Sheets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const role = body.role as "respondent" | "admin" | undefined;
    const status = body.status as "active" | "disabled" | "pending" | undefined;

    if (!email || (!role && !status)) {
      return NextResponse.json({ error: "email and role/status are required." }, { status: 400 });
    }

    await updateAllowedUser(email, { role, status });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin users update error:", err);
    return NextResponse.json({ error: err.message || "Could not update user." }, { status: 500 });
  }
}
