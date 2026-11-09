import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubmissionsSummary } from "@/lib/sheets";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  try {
    const summary = await getSubmissionsSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (err: any) {
    console.error("summary error:", err);
    return NextResponse.json({ error: "Could not load summary from Google Sheets." }, { status: 500 });
  }
}
