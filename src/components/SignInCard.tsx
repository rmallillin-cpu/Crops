"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function SignInCard() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Incorrect email/password, or your account isn't active yet.");
      } else if (res?.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="ledger-card animate-rise-in w-full max-w-md p-8">
      <p className="field-number">Access</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
        Sign in to continue
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ledger-ink/70">
        This form is limited to agriculture focal persons registered by the provincial
        PSA office. Sign in with the Google account or the email/password your office
        provided.
      </p>

      <button
        className="btn-primary mt-6 w-full"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          signIn("google");
        }}
      >
        {googleLoading ? (
          "Opening Google sign-in…"
        ) : (
          <>
            <GoogleMark />
            Continue with Google
          </>
        )}
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-ledger-line" />
        <span className="text-xs uppercase tracking-wide text-ledger-ink/40">or</span>
        <div className="h-px flex-1 bg-ledger-line" />
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
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
          <label className="text-xs font-medium text-ledger-ink/60">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-sm border border-ledger-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-cavite-blue"
          />
        </div>

        {error && <p className="text-sm text-cavite-red">{error}</p>}

        <button type="submit" disabled={emailLoading} className="btn-secondary w-full">
          {emailLoading ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ledger-ink/60">
        New respondent?{" "}
        <Link href="/register" className="font-medium text-cavite-blue hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6c-2 1.5-4.6 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.4 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
