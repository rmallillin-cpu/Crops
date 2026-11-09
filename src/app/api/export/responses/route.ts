import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllResponses } from "@/lib/sheets";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  try {
    const responses = await getAllResponses();
    const header = [
      "timestamp",
      "lguSlug",
      "lguName",
      "respondentEmail",
      "respondentName",
      "cropId",
      "cropName",
      "major",
      "priority",
      "emerging",
      "others",
      "discontinue",
      "remarks",
    ];
    const lines = [header.join(",")];
    for (const r of responses) {
      lines.push(
        [
          r.timestamp,
          r.lguSlug,
          r.lguName,
          r.respondentEmail,
          r.respondentName,
          r.cropId,
          r.cropName,
          r.major,
          r.priority,
          r.emerging,
          r.others,
          r.discontinue,
          r.remarks,
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cavite-crop-responses-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("export responses error:", err);
    return NextResponse.json({ error: "Could not export responses." }, { status: 500 });
  }
}
