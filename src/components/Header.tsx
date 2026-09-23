import Image from "next/image";

export default function Header({
  eyebrow = "Philippine Statistics Authority — Region IV-A (CALABARZON)",
  right,
}: {
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-ledger-line/70 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/psa-logo.png"
            alt="Philippine Statistics Authority seal"
            width={40}
            height={40}
            className="shrink-0 rounded-full ring-1 ring-ledger-line"
            priority
          />
          <div className="leading-tight">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-cavite-blue/70">
              {eyebrow}
            </p>
            <p className="font-display text-lg font-bold tracking-tight text-cavite-bluedeep">
              Cavite Crop List Registry
            </p>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
