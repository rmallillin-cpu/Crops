"use client";

import { useState, useEffect } from "react";
import { CropEntry } from "@/types";
import CropRow from "./CropRow";

const HEADER_LABELS = ["Major", "Priority", "Emerging", "Others", "Discont."];

export default function CropCategory({
  categoryIndex,
  name,
  entries,
  onChangeEntry,
  forceOpen,
}: {
  categoryIndex: number;
  name: string;
  entries: CropEntry[];
  onChangeEntry: (cropId: number, next: CropEntry) => void;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(categoryIndex === 0);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const markedCount = entries.filter(
    (e) => e.major || e.priority || e.emerging || e.others || e.discontinue
  ).length;

  return (
    <section id={`cat-${categoryIndex}`} className="ledger-card mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 bg-cavite-blue/[0.04] px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="field-number">{String(categoryIndex + 1).padStart(2, "0")}</span>
          <h3 className="font-display text-base font-semibold text-cavite-bluedeep sm:text-lg">
            {name}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip border-cavite-blue/20 bg-white/60 text-cavite-blue">
            {markedCount}/{entries.length} marked
          </span>
          <span className={`text-ledger-ink/50 transition-transform ${open ? "rotate-180" : ""}`}>
            ⌄
          </span>
        </div>
      </button>

      {open && (
        <div>
          <div className="grid grid-cols-[1fr_repeat(5,44px)_32px] items-end gap-1 border-b border-ledger-line bg-ledger-paper px-3 py-2 sm:gap-2">
            <span className="field-number">Crop</span>
            {HEADER_LABELS.map((h) => (
              <span key={h} className="text-center text-[10px] font-medium text-ledger-ink/55">
                {h}
              </span>
            ))}
            <span />
          </div>
          <div>
            {entries.map((entry) => (
              <CropRow
                key={entry.cropId}
                entry={entry}
                onChange={(next) => onChangeEntry(entry.cropId, next)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
