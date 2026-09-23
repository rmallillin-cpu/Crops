"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SubmissionSummary } from "@/types";
import { LGUS } from "@/lib/lgus";
import QrPanel from "./QrPanel";
import AccountsPanel from "./AccountsPanel";

const CATEGORY_META = [
  { key: "major", label: "Major produce", cls: "bg-cavite-blue" },
  { key: "priority", label: "Priority", cls: "bg-cavite-gold" },
  { key: "emerging", label: "Emerging", cls: "bg-cavite-sage" },
  { key: "others", label: "Others", cls: "bg-ledger-ink/40" },
  { key: "discontinue", label: "Discontinue", cls: "bg-cavite-red" },
] as const;

export default function AdminClient() {
  const [summary, setSummary] = useState<SubmissionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "pending">("all");
  const [initializing, setInitializing] = useState(false);

  function loadSummary() {
    fetch("/api/summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setError("");
          setSummary(d.summary);
        }
      })
      .catch(() => setError("Could not reach the server."));
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function handleInitialize() {
    setInitializing(true);
    try {
      const res = await fetch("/api/admin/init", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Could not initialize the spreadsheet.");
    } finally {
      setInitializing(false);
    }
  }

  const submittedCount = useMemo(
    () => (summary || []).filter((s) => s.totalCrops > 0).length,
    [summary]
  );

  const provinceTotals = useMemo(() => {
    const totals = { major: 0, priority: 0, emerging: 0, others: 0, discontinue: 0, totalCrops: 0 };
    for (const s of summary || []) {
      totals.major += s.major;
      totals.priority += s.priority;
      totals.emerging += s.emerging;
      totals.others += s.others;
      totals.discontinue += s.discontinue;
      totals.totalCrops += s.totalCrops;
    }
    return totals;
  }, [summary]);

  const rows = useMemo(() => {
    if (!summary) return [];
    const byLgu = new Map(summary.map((s) => [s.lguSlug, s]));
    const merged = LGUS.map((l) => byLgu.get(l.slug)).filter(Boolean) as SubmissionSummary[];
    if (filter === "submitted") return merged.filter((r) => r.totalCrops > 0);
    if (filter === "pending") return merged.filter((r) => r.totalCrops === 0);
    return merged;
  }, [summary, filter]);

  const maxCrops = Math.max(1, ...(summary || []).map((s) => s.totalCrops));

  if (error) {
    return (
      <div className="ledger-card mx-auto mt-10 max-w-md p-6 text-center">
        <p className="text-sm text-cavite-red">{error}</p>
        <p className="mt-3 text-xs text-ledger-ink/60">
          If this is a fresh Google Sheet, it likely just needs its tabs created.
        </p>
        <button className="btn-primary mt-4" onClick={handleInitialize} disabled={initializing}>
          {initializing ? "Setting up sheet…" : "Initialize spreadsheet tabs"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Province-wide progress */}
      <section className="ledger-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="field-number">Province of Cavite</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
              {submittedCount} of {LGUS.length} LGUs reported
            </h2>
          </div>
          <div className="flex gap-2 text-xs">
            {(["all", "submitted", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 font-medium capitalize transition-colors ${
                  filter === f
                    ? "border-cavite-blue bg-cavite-blue text-white"
                    : "border-ledger-line text-ledger-ink/60 hover:border-cavite-blue/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ledger-line">
          <div
            className="h-full rounded-full bg-cavite-blue transition-all"
            style={{ width: `${summary ? (submittedCount / LGUS.length) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {CATEGORY_META.map((c) => (
            <div key={c.key}>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${c.cls}`} />
                <span className="text-xs text-ledger-ink/60">{c.label}</span>
              </div>
              <p className="mt-1 font-display text-xl font-semibold text-cavite-bluedeep">
                {summary ? (provinceTotals as any)[c.key] : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-LGU comparison bars */}
      <section className="ledger-card p-6">
        <p className="field-number">Crops marked, by city/municipality</p>
        <div className="mt-4 space-y-2.5">
          {(summary ? [...summary] : [])
            .sort((a, b) => b.totalCrops - a.totalCrops)
            .map((s) => (
              <div key={s.lguSlug} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-ledger-ink/70">{s.lguName}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ledger-line">
                  <div
                    className={`h-full rounded-full ${s.totalCrops > 0 ? "bg-cavite-blue" : "bg-transparent"}`}
                    style={{ width: `${(s.totalCrops / maxCrops) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-ledger-ink/60">
                  {s.totalCrops}
                </span>
              </div>
            ))}
          {!summary && <p className="text-sm text-ledger-ink/40">Loading…</p>}
        </div>
      </section>

      {/* LGU cards */}
      <section>
        <p className="field-number mb-3">All 23 cities and municipalities</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Link
              key={s.lguSlug}
              href={`/admin/lgu/${s.lguSlug}`}
              className="ledger-card group p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-cavite-bluedeep">
                  {s.lguName}
                </h3>
                <span
                  className={`chip shrink-0 text-[11px] ${
                    s.totalCrops > 0
                      ? "border-cavite-sage/30 bg-cavite-sage/10 text-cavite-sage"
                      : "border-ledger-line bg-ledger-line/40 text-ledger-ink/50"
                  }`}
                >
                  {s.totalCrops > 0 ? "Submitted" : "Pending"}
                </span>
              </div>

              {s.totalCrops > 0 ? (
                <>
                  <p className="mt-2 text-xs text-ledger-ink/60">
                    {s.respondentName || s.respondentEmail}
                  </p>
                  <p className="mt-3 font-display text-2xl font-semibold text-cavite-blue">
                    {s.totalCrops}
                    <span className="ml-1 text-xs font-normal text-ledger-ink/50">crops marked</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ledger-ink/55">
                    <span>{s.major} major</span>
                    <span>{s.priority} priority</span>
                    <span>{s.emerging} emerging</span>
                    <span>{s.discontinue} to discontinue</span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-ledger-ink/45">
                  No submission yet from this office.
                </p>
              )}
            </Link>
          ))}
          {!summary && <p className="text-sm text-ledger-ink/40">Loading summary…</p>}
        </div>
      </section>

      <AccountsPanel />

      <QrPanel lgus={LGUS} />
    </div>
  );
}
