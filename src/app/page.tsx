import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import SignInCard from "@/components/SignInCard";
import { LGUS } from "@/lib/lgus";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/form");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 max-w-xl text-center">
          <p className="field-number">Provincial Crop Inventory · 2026 Update</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-cavite-bluedeep sm:text-5xl">
            Updating the list of crops
            <span className="block text-cavite-blue">across Cavite&apos;s {LGUS.length} LGUs</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-sm leading-relaxed text-ledger-ink/70">
            Each city and municipal agriculture office marks its major produce, priority
            and emerging crops, and flags entries for discontinuation — the same
            categories used in the printed PSA worksheet, now saved straight to a shared
            record.
          </p>
        </div>

        <SignInCard />

        <p className="mt-8 max-w-md text-center text-xs text-ledger-ink/50">
          Received a QR code or link from your provincial focal person? Scanning it
          brings you straight here — sign in with the same Google account they
          registered for you.
        </p>
      </main>

      <footer className="border-t border-ledger-line px-6 py-5 text-center text-xs text-ledger-ink/50">
        Philippine Statistics Authority · Region IV-A (CALABARZON) · Provincial Statistical Services Office, Cavite
      </footer>
    </div>
  );
}
