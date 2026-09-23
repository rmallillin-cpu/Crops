"use client";

import { useEffect, useState } from "react";
import { AllowedUser } from "@/types";
import { getLguBySlug } from "@/lib/lgus";

export default function AccountsPanel() {
  const [users, setUsers] = useState<Omit<AllowedUser, "passwordHash">[] | null>(null);
  const [error, setError] = useState("");
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setError("");
          setUsers(d.users);
        }
      })
      .catch(() => setError("Could not reach the server."));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(email: string, updates: { role?: string; status?: string }) {
    setBusyEmail(email);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err: any) {
      setError(err.message || "Could not update account.");
    } finally {
      setBusyEmail(null);
    }
  }

  const pending = (users || []).filter((u) => u.status === "pending");
  const others = (users || []).filter((u) => u.status !== "pending");

  return (
    <section className="ledger-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="field-number">Accounts</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-cavite-bluedeep">
            Respondent registrations
          </h2>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/summary" className="btn-secondary text-xs">
            Export summary (CSV)
          </a>
          <a href="/api/export/responses" className="btn-secondary text-xs">
            Export all responses (CSV)
          </a>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-cavite-red">{error}</p>}

      {pending.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-cavite-gold">
            Awaiting approval ({pending.length})
          </p>
          <div className="mt-2 space-y-2">
            {pending.map((u) => (
              <div
                key={u.email}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-cavite-gold/30 bg-cavite-gold/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-cavite-bluedeep">
                    {u.name || u.email}
                  </p>
                  <p className="text-xs text-ledger-ink/60">
                    {u.email} · {getLguBySlug(u.lguSlug)?.name || u.lguSlug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary text-xs"
                    disabled={busyEmail === u.email}
                    onClick={() => updateUser(u.email, { status: "active" })}
                  >
                    Activate
                  </button>
                  <button
                    className="btn-secondary text-xs"
                    disabled={busyEmail === u.email}
                    onClick={() => updateUser(u.email, { status: "disabled" })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ledger-ink/50">
          All accounts ({others.length})
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-ledger-ink/50">
                <th className="pb-2 pr-3 font-medium">Name / Email</th>
                <th className="pb-2 pr-3 font-medium">LGU</th>
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {others.map((u) => (
                <tr key={u.email} className="border-t border-ledger-line/60">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-cavite-bluedeep">{u.name || "—"}</p>
                    <p className="text-ledger-ink/55">{u.email}</p>
                  </td>
                  <td className="py-2 pr-3 text-ledger-ink/70">
                    {getLguBySlug(u.lguSlug)?.name || u.lguSlug || "—"}
                  </td>
                  <td className="py-2 pr-3 capitalize text-ledger-ink/70">{u.role}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`chip text-[10px] ${
                        u.status === "active"
                          ? "border-cavite-sage/30 bg-cavite-sage/10 text-cavite-sage"
                          : "border-cavite-red/30 bg-cavite-red/10 text-cavite-red"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {u.status === "active" ? (
                        <button
                          className="btn-secondary px-2 py-1 text-[11px]"
                          disabled={busyEmail === u.email}
                          onClick={() => updateUser(u.email, { status: "disabled" })}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          className="btn-secondary px-2 py-1 text-[11px]"
                          disabled={busyEmail === u.email}
                          onClick={() => updateUser(u.email, { status: "active" })}
                        >
                          Activate
                        </button>
                      )}
                      {u.role === "respondent" ? (
                        <button
                          className="btn-secondary px-2 py-1 text-[11px]"
                          disabled={busyEmail === u.email}
                          onClick={() => updateUser(u.email, { role: "admin" })}
                        >
                          Make admin
                        </button>
                      ) : (
                        <button
                          className="btn-secondary px-2 py-1 text-[11px]"
                          disabled={busyEmail === u.email}
                          onClick={() => updateUser(u.email, { role: "respondent" })}
                        >
                          Make respondent
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!users && (
                <tr>
                  <td colSpan={5} className="py-3 text-ledger-ink/40">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
