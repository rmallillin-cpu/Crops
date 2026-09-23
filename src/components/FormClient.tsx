"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CropCategory as CropCategoryType, CropEntry } from "@/types";
import CropCategory from "./CropCategory";

type Props = {
  categories: CropCategoryType[];
  lguSlug: string;
  lguName: string;
  respondentEmail: string;
};

function draftKey(lguSlug: string, email: string) {
  return `psa-cavite-draft:${lguSlug}:${email}`;
}

function buildInitialEntries(categories: CropCategoryType[]): Record<number, CropEntry> {
  const map: Record<number, CropEntry> = {};
  for (const cat of categories) {
    for (const crop of cat.crops) {
      map[crop.id] = {
        cropId: crop.id,
        cropName: crop.name,
        major: false,
        priority: false,
        emerging: false,
        others: false,
        discontinue: false,
        remarks: "",
      };
    }
  }
  return map;
}

export default function FormClient({ categories, lguSlug, lguName, respondentEmail }: Props) {
  const [entries, setEntries] = useState<Record<number, CropEntry>>(() =>
    buildInitialEntries(categories)
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const hydrated = useRef(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(lguSlug, respondentEmail));
      if (raw) {
        const parsed = JSON.parse(raw);
        setEntries((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore corrupt draft
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft
  useEffect(() => {
    if (!hydrated.current) return;
    setStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(lguSlug, respondentEmail), JSON.stringify(entries));
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [entries, lguSlug, respondentEmail]);

  const totalMarked = useMemo(
    () =>
      Object.values(entries).filter(
        (e) => e.major || e.priority || e.emerging || e.others || e.discontinue
      ).length,
    [entries]
  );

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        crops: cat.crops.filter((c) => c.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.crops.length > 0);
  }, [categories, search]);

  function handleChangeEntry(cropId: number, next: CropEntry) {
    setEntries((prev) => ({ ...prev, [cropId]: next }));
  }

  async function handleSubmit() {
    setSubmitState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lguSlug, entries: Object.values(entries) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitState("done");
      localStorage.removeItem(draftKey(lguSlug, respondentEmail));
    } catch (err: any) {
      setSubmitState("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  }

  if (submitState === "done") {
    return (
      <div className="ledger-card animate-rise-in mx-auto max-w-lg p-8 text-center">
        <p className="field-number text-cavite-sage">Recorded</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
          Thank you — {lguName}&apos;s list is saved
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ledger-ink/70">
          {totalMarked} crop{totalMarked === 1 ? "" : "s"} marked and written to the
          provincial record. You can return to this form any time to make changes —
          your latest submission always replaces the last one for {lguName}.
        </p>
        <button className="btn-secondary mt-6" onClick={() => setSubmitState("idle")}>
          Make further edits
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-ledger-line bg-ledger-paper/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="field-number">Reporting for</p>
            <p className="font-display text-lg font-semibold text-cavite-bluedeep">{lguName}</p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crops…"
            className="w-48 rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm focus:border-cavite-blue sm:w-64"
          />

          <div className="flex items-center gap-3">
            <span className="chip border-cavite-blue/20 bg-white/70 text-cavite-blue">
              {totalMarked} marked
            </span>
            <span className="text-xs text-ledger-ink/40">
              {status === "saving" && "Saving draft…"}
              {status === "saved" && "Draft saved"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-0 pb-32">
        {filteredCategories.length === 0 && (
          <p className="py-16 text-center text-sm text-ledger-ink/50">
            No crops match &ldquo;{search}&rdquo;.
          </p>
        )}
        {filteredCategories.map((cat, i) => {
          const catEntries = cat.crops.map((c) => entries[c.id]).filter(Boolean);
          const originalIndex = categories.findIndex((c) => c.name === cat.name);
          return (
            <CropCategory
              key={cat.name}
              categoryIndex={originalIndex}
              name={cat.name}
              entries={catEntries}
              onChangeEntry={handleChangeEntry}
              forceOpen={Boolean(search.trim())}
            />
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-ledger-line bg-ledger-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm">
            <span className="font-semibold text-cavite-bluedeep">{totalMarked}</span>
            <span className="text-ledger-ink/60"> of {Object.keys(entries).length} crops marked</span>
            {errorMsg && <p className="mt-0.5 text-xs text-cavite-red">{errorMsg}</p>}
          </div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitState === "submitting"}
          >
            {submitState === "submitting" ? "Saving to registry…" : "Submit crop list"}
          </button>
        </div>
      </div>
    </div>
  );
}
