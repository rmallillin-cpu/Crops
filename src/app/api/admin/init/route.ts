import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureSheetStructure } from "@/lib/sheets";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  try {
    await ensureSheetStructure();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("init error:", err);
    return NextResponse.json(
      { error: err.message || "Could not initialize the spreadsheet." },
      { status: 500 }
    );
  }
}
