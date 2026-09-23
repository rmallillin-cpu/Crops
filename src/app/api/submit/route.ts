import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitCropEntries, findAllowedUser } from "@/lib/sheets";
import { getLguBySlug } from "@/lib/lgus";
import { CropEntry } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const allowed = await findAllowedUser(session.user.email);
  if (!allowed || allowed.status !== "active") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json();
  const lguSlug: string = body.lguSlug;
  const entries: CropEntry[] = body.entries;

  if (!lguSlug || !getLguBySlug(lguSlug)) {
    return NextResponse.json({ error: "Invalid city/municipality." }, { status: 400 });
  }
  if (allowed.role !== "admin" && allowed.lguSlug !== lguSlug) {
    return NextResponse.json(
      { error: "You are only authorized to submit data for your assigned city/municipality." },
      { status: 403 }
    );
  }
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "Missing crop entries." }, { status: 400 });
  }

  try {
    const result = await submitCropEntries({
      lguSlug,
      respondentEmail: session.user.email,
      respondentName: session.user.name || allowed.name || session.user.email,
      entries,
    });
    return NextResponse.json({ ok: true, savedRows: result.savedRows });
  } catch (err: any) {
    console.error("submit error:", err);
    return NextResponse.json({ error: "Could not save to Google Sheets. Try again." }, { status: 500 });
  }
}
