import Header from "@/components/Header";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="ledger-card max-w-md p-8">
          <p className="field-number text-cavite-red">Access not granted</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-cavite-bluedeep">
            This account isn&apos;t on the registry
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ledger-ink/70">
            Your Google account isn&apos;t yet listed as a respondent for any Cavite
            city or municipality. Ask your PSA provincial focal person to add your
            email address, then try signing in again.
          </p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            Back to sign-in
          </Link>
        </div>
      </main>
    </div>
  );
}
