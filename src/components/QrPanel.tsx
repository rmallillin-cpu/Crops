"use client";

import { useEffect, useState } from "react";
import { Lgu } from "@/lib/lgus";

export default function QrPanel({ lgus }: { lgus: Lgu[] }) {
  const [origin, setOrigin] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/` : "";

  async function generate() {
    if (!link) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/qr?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      setDataUrl(data.dataUrl);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="ledger-card p-6">
      <p className="field-number">Distribute to respondents</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-cavite-bluedeep">
        Share the sign-in link or QR code
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ledger-ink/70">
        Every registered respondent uses the same link — after signing in with their
        Google account, they&apos;re shown only their assigned city or municipality&apos;s
        crop list. Add each person under their LGU in the{" "}
        <span className="font-mono text-xs">AllowedUsers</span> sheet tab before sharing.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 rounded-sm border border-ledger-line bg-white/70 px-3 py-2 font-mono text-xs text-ledger-ink"
        />
        <button className="btn-secondary px-3 py-2 text-xs" onClick={copyLink}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-4">
        {!dataUrl ? (
          <button className="btn-primary" onClick={generate} disabled={loading || !link}>
            {loading ? "Generating…" : "Generate QR code"}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR code for sign-in link" className="h-32 w-32 rounded-sm border border-ledger-line" />
            <a
              href={dataUrl}
              download="cavite-crop-registry-qr.png"
              className="btn-secondary text-xs"
            >
              Download PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
