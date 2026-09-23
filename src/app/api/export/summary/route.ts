import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubmissionsSummary } from "@/lib/sheets";

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
    const summary = await getSubmissionsSummary();
    const header = [
      "lguSlug",
      "lguName",
      "respondentEmail",
      "respondentName",
      "submittedAt",
      "totalCrops",
      "major",
      "priority",
      "emerging",
      "others",
      "discontinue",
    ];
    const lines = [header.join(",")];
    for (const s of summary) {
      lines.push(
        [
          s.lguSlug,
          s.lguName,
          s.respondentEmail,
          s.respondentName,
          s.submittedAt,
          s.totalCrops,
          s.major,
          s.priority,
          s.emerging,
          s.others,
          s.discontinue,
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
        "Content-Disposition": `attachment; filename="cavite-crop-summary-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("export summary error:", err);
    return NextResponse.json({ error: "Could not export summary." }, { status: 500 });
  }
}
