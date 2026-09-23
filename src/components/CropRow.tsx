"use client";

import { useState } from "react";
import { CropEntry } from "@/types";

const FLAGS: { key: keyof Pick<CropEntry, "major" | "priority" | "emerging" | "others" | "discontinue">; cls: string; label: string }[] = [
  { key: "major", cls: "c-major", label: "Major produce" },
  { key: "priority", cls: "c-priority", label: "Priority crop" },
  { key: "emerging", cls: "c-emerging", label: "Emerging crop" },
  { key: "others", cls: "c-others", label: "Others" },
  { key: "discontinue", cls: "c-discontinue", label: "Discontinue" },
];

export default function CropRow({
  entry,
  onChange,
  highlighted,
}: {
  entry: CropEntry;
  onChange: (next: CropEntry) => void;
  highlighted?: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(Boolean(entry.remarks));
  const hasAnyFlag = entry.major || entry.priority || entry.emerging || entry.others || entry.discontinue;

  return (
    <div
      className={`grid grid-cols-[1fr_repeat(5,44px)_32px] items-center gap-1 border-b border-ledger-line/70 px-3 py-2 text-sm transition-colors sm:gap-2 ${
        hasAnyFlag ? "bg-cavite-blue/[0.03]" : ""
      } ${highlighted ? "ring-1 ring-cavite-gold/60" : ""}`}
    >
      <div>
        <p className="text-ledger-ink">{entry.cropName}</p>
        {noteOpen && (
          <input
            type="text"
            value={entry.remarks}
            onChange={(e) => onChange({ ...entry, remarks: e.target.value })}
            placeholder="Remarks (optional)"
            className="mt-1 w-full max-w-sm rounded-sm border border-ledger-line bg-white/70 px-2 py-1 text-xs text-ledger-ink placeholder:text-ledger-ink/35 focus:border-cavite-blue"
          />
        )}
      </div>

      {FLAGS.map((f) => (
        <div key={f.key} className="flex justify-center" title={f.label}>
          <input
            type="checkbox"
            className={`stamp-check ${f.cls}`}
            checked={entry[f.key]}
            onChange={(e) => onChange({ ...entry, [f.key]: e.target.checked })}
            aria-label={`${entry.cropName} — ${f.label}`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setNoteOpen((v) => !v)}
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
          entry.remarks ? "bg-cavite-gold/30 text-cavite-bluedeep" : "text-ledger-ink/30 hover:bg-ledger-line/60"
        }`}
        aria-label="Toggle remarks field"
        title="Add remarks"
      >
        ✎
      </button>
    </div>
  );
}
