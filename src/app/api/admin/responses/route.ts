import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLguBySlug } from "@/lib/lgus";
import { adminDeleteLguResponses, adminUpdateLguResponse } from "@/lib/sheets";

const FLAG_KEYS = ["major", "priority", "emerging", "others", "discontinue"] as const;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== "admin") return null;
  return session.user.email;
}

/** Edit one crop's category/remarks for an LGU. Body: { lguSlug, cropId, major..discontinue, remarks } */
export async function PATCH(req: NextRequest) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json();
  const lguSlug: string = body.lguSlug;
  const cropId = Number(body.cropId);
  if (!lguSlug || !getLguBySlug(lguSlug) || !Number.isFinite(cropId)) {
    return NextResponse.json({ error: "Invalid city/municipality or crop." }, { status: 400 });
  }

  // One category at most (keep the first if several are sent).
  const first = FLAG_KEYS.find((k) => body[k] === true);
  const flags = {
    major: first === "major",
    priority: first === "priority",
    emerging: first === "emerging",
    others: first === "others",
    discontinue: first === "discontinue",
  };
  const remarks = typeof body.remarks === "string" ? body.remarks.slice(0, 500) : "";

  try {
    const result = await adminUpdateLguResponse({ lguSlug, cropId, flags, remarks, adminEmail });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("admin update error:", err);
    return NextResponse.json({ error: err.message || "Could not update the response." }, { status: 500 });
  }
}

/** Delete one crop's response (give cropId) or the LGU's whole submission (omit cropId). */
export async function DELETE(req: NextRequest) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json();
  const lguSlug: string = body.lguSlug;
  if (!lguSlug || !getLguBySlug(lguSlug)) {
    return NextResponse.json({ error: "Invalid city/municipality." }, { status: 400 });
  }
  const cropId = body.cropId === undefined || body.cropId === null ? undefined : Number(body.cropId);
  if (cropId !== undefined && !Number.isFinite(cropId)) {
    return NextResponse.json({ error: "Invalid crop." }, { status: 400 });
  }

  try {
    const result = await adminDeleteLguResponses({ lguSlug, cropId, adminEmail });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("admin delete error:", err);
    return NextResponse.json({ error: "Could not delete the response." }, { status: 500 });
  }
}
