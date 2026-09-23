import Image from "next/image";

export default function Header({
  eyebrow = "Philippine Statistics Authority — Region IV-A (CALABARZON)",
  right,
}: {
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="border-b border-ledger-line bg-ledger-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/psa-logo.png"
            alt="Philippine Statistics Authority seal"
            width={44}
            height={44}
            className="shrink-0"
            priority
          />
          <div className="leading-tight">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cavite-blue/70">
              {eyebrow}
            </p>
            <p className="font-display text-lg font-semibold text-cavite-bluedeep">
              Cavite Crop List Registry
            </p>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
