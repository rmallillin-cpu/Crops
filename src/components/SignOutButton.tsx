"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs font-medium text-ledger-ink/50 underline-offset-2 hover:text-cavite-blue hover:underline"
    >
      Sign out
    </button>
  );
}
