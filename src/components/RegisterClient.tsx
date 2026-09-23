"use client";

import { useState } from "react";
import Link from "next/link";
import { LGUS } from "@/lib/lgus";

export default function RegisterClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [lguSlug, setLguSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "pending" | "active">(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!lguSlug) {
      setError("Select your city or municipality.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, lguSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setDone(data.status === "active" ? "active" : "pending");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="ledger-card w-full max-w-md p-8 text-center">
        <p className="field-number">Registration</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
          {done === "active" ? "You're all set" : "Submitted for review"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ledger-ink/70">
          {done === "active"
            ? "Your account is already active — you can sign in with your email and password now."
            : "An administrator needs to activate your account before you can sign in. This is usually quick — check back soon, or reach out to your provincial focal person."}
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Back to sign-in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ledger-card w-full max-w-md p-8">
      <p className="field-number">Registration</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
        Register as a respondent
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ledger-ink/70">
        Create an account with your email and password. An administrator will review and
        activate it before you can sign in.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-ledger-ink/60">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ledger-ink/60">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ledger-ink/60">
            City / Municipality
          </label>
          <select
            required
            value={lguSlug}
            onChange={(e) => setLguSlug(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          >
            <option value="">Select…</option>
            {LGUS.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-ledger-ink/60">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ledger-ink/60">Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-cavite-red">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
        {loading ? "Submitting…" : "Register"}
      </button>

      <p className="mt-4 text-center text-xs text-ledger-ink/60">
        Already have an account?{" "}
        <Link href="/" className="font-medium text-cavite-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
