"use client";

import { useState } from "react";
import { LguResponse } from "@/types";

const FLAGS = [
  { key: "major", label: "Major", cls: "c-major", text: "text-cavite-blue" },
  { key: "priority", label: "Priority", cls: "c-priority", text: "text-cavite-gold" },
  { key: "emerging", label: "Emerging", cls: "c-emerging", text: "text-cavite-sage" },
  { key: "others", label: "Others", cls: "c-others", text: "text-ledger-ink/60" },
  { key: "discontinue", label: "Discont.", cls: "c-discontinue", text: "text-cavite-red" },
] as const;

type FlagKey = (typeof FLAGS)[number]["key"];
type Draft = Pick<LguResponse, FlagKey | "remarks">;

const COLS = "grid-cols-[1fr_repeat(5,56px)_120px]";

export default function LguResponsesEditor({
  lguSlug,
  lguName,
  initial,
}: {
  lguSlug: string;
  lguName: string;
  initial: LguResponse[];
}) {
  const [rows, setRows] = useState<LguResponse[]>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function startEdit(r: LguResponse) {
    setError("");
    setEditingId(r.cropId);
    setDraft({
      major: r.major,
      priority: r.priority,
      emerging: r.emerging,
      others: r.others,
      discontinue: r.discontinue,
      remarks: r.remarks,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  // One category per crop; clicking the selected one clears it.
  function pick(key: FlagKey) {
    if (!draft) return;
    setDraft({
      major: false,
      priority: false,
      emerging: false,
      others: false,
      discontinue: false,
      remarks: draft.remarks,
      [key]: !draft[key],
    });
  }

  async function call(method: "PATCH" | "DELETE", body: object) {
    const res = await fetch("/api/admin/responses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lguSlug, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function saveEdit(cropId: number) {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const data = await call("PATCH", { cropId, ...draft });
      setRows((prev) =>
        data.deleted
          ? prev.filter((r) => r.cropId !== cropId)
          : prev.map((r) => (r.cropId === cropId ? { ...r, ...draft, remarks: draft.remarks.trim() } : r))
      );
      cancelEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow(r: LguResponse) {
    if (!window.confirm(`Delete ${lguName}'s response for "${r.cropName}"? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await call("DELETE", { cropId: r.cropId });
      setRows((prev) => prev.filter((x) => x.cropId !== r.cropId));
      if (editingId === r.cropId) cancelEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    if (
      !window.confirm(
        `Delete ALL ${rows.length} responses from ${lguName}? Their status will go back to Pending. This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await call("DELETE", {});
      setRows([]);
      cancelEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-cavite-bluedeep">{lguName}</h1>
        <div className="flex items-center gap-2">
          <span className="chip border-cavite-blue/20 bg-white/70 text-cavite-blue">{rows.length} crops</span>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={busy}
              className="rounded-full border border-cavite-red/30 px-3 py-1 text-xs font-semibold text-cavite-red transition-colors hover:bg-cavite-red/5 disabled:opacity-50"
            >
              Clear whole submission
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-cavite-red">{error}</p>}

      {rows.length === 0 ? (
        <p className="ledger-card mt-6 p-6 text-sm text-ledger-ink/50">
          No submission recorded yet for {lguName}.
        </p>
      ) : (
        <div className="ledger-card mt-6 overflow-hidden">
          <div className={`grid ${COLS} gap-1 border-b border-ledger-line bg-cavite-blue/[0.04] px-3 py-2`}>
            <span className="field-number">Crop</span>
            {FLAGS.map((f) => (
              <span key={f.key} className="text-center text-[10px] font-medium text-ledger-ink/55">
                {f.label}
              </span>
            ))}
            <span />
          </div>

          {rows.map((r) => {
            const editing = editingId === r.cropId && draft;
            return (
              <div
                key={r.cropId}
                className={`grid ${COLS} items-center gap-1 border-b border-ledger-line/70 px-3 py-2 text-sm ${
                  editing ? "bg-cavite-gold/[0.06]" : ""
                }`}
              >
                <div>
                  <p>{r.cropName}</p>
                  {editing ? (
                    <input
                      type="text"
                      value={draft.remarks}
                      onChange={(e) => setDraft({ ...draft, remarks: e.target.value })}
                      placeholder="Remarks (optional)"
                      maxLength={500}
                      className="mt-1 w-full max-w-sm rounded-sm border border-ledger-line bg-white/70 px-2 py-1 text-xs text-ledger-ink placeholder:text-ledger-ink/35 focus:border-cavite-blue"
                    />
                  ) : (
                    r.remarks && <p className="text-xs italic text-ledger-ink/50">{r.remarks}</p>
                  )}
                </div>

                {FLAGS.map((f) => (
                  <div key={f.key} className="flex justify-center">
                    {editing ? (
                      <input
                        type="radio"
                        name={`admin-crop-${r.cropId}`}
                        className={`stamp-radio ${f.cls}`}
                        checked={draft[f.key]}
                        onChange={() => {}}
                        onClick={() => pick(f.key)}
                        aria-label={`${r.cropName} — ${f.label}`}
                      />
                    ) : (
                      <span className={f.text}>{r[f.key] ? "●" : ""}</span>
                    )}
                  </div>
                ))}

                <div className="flex justify-end gap-2 text-xs font-medium">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(r.cropId)}
                        disabled={busy}
                        className="text-cavite-blue hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={busy}
                        className="text-ledger-ink/50 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        disabled={busy}
                        className="text-cavite-blue hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(r)}
                        disabled={busy}
                        className="text-cavite-red hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
