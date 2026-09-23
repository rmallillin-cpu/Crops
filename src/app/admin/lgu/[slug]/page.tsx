import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import { getLguBySlug } from "@/lib/lgus";
import { getLguResponses } from "@/lib/sheets";
import { notFound } from "next/navigation";

const FLAGS = [
  { key: "major", label: "Major", cls: "text-cavite-blue" },
  { key: "priority", label: "Priority", cls: "text-cavite-gold" },
  { key: "emerging", label: "Emerging", cls: "text-cavite-sage" },
  { key: "others", label: "Others", cls: "text-ledger-ink/60" },
  { key: "discontinue", label: "Discontinue", cls: "text-cavite-red" },
] as const;

export default async function LguDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const lgu = getLguBySlug(params.slug);
  if (!lgu) notFound();

  const responses = await getLguResponses(lgu.slug);

  return (
    <div className="min-h-screen">
      <Header eyebrow="PSA Region IV-A — Administrator view" right={<SignOutButton />} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/admin" className="text-xs text-cavite-blue hover:underline">
          ← Back to dashboard
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-cavite-bluedeep">{lgu.name}</h1>
          <span className="chip border-cavite-blue/20 bg-white/70 text-cavite-blue">
            {responses.length} crops
          </span>
        </div>

        {responses.length === 0 ? (
          <p className="ledger-card mt-6 p-6 text-sm text-ledger-ink/50">
            No submission recorded yet for {lgu.name}.
          </p>
        ) : (
          <div className="ledger-card mt-6 overflow-hidden">
            <div className="grid grid-cols-[1fr_repeat(5,64px)] gap-1 border-b border-ledger-line bg-cavite-blue/[0.04] px-3 py-2">
              <span className="field-number">Crop</span>
              {FLAGS.map((f) => (
                <span key={f.key} className="text-center text-[10px] font-medium text-ledger-ink/55">
                  {f.label}
                </span>
              ))}
            </div>
            {responses.map((r) => (
              <div
                key={r.cropId}
                className="grid grid-cols-[1fr_repeat(5,64px)] items-center gap-1 border-b border-ledger-line/70 px-3 py-2 text-sm"
              >
                <div>
                  <p>{r.cropName}</p>
                  {r.remarks && <p className="text-xs italic text-ledger-ink/50">{r.remarks}</p>}
                </div>
                {FLAGS.map((f) => (
                  <span key={f.key} className={`text-center ${f.cls}`}>
                    {(r as any)[f.key] ? "✓" : ""}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
