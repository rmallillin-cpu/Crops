import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import FormClient from "@/components/FormClient";
import { getLguBySlug, LGUS } from "@/lib/lgus";
import crops from "@/data/crops.json";
import { CropCategory } from "@/types";

export default async function FormPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");

  const role = session.user.role;
  const lguSlug = session.user.lguSlug || "";
  const lgu = getLguBySlug(lguSlug);

  if (role !== "admin" && !lgu) {
    redirect("/unauthorized");
  }

  // Admins with no assigned LGU land on the dashboard instead of a form.
  if (role === "admin" && !lgu) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen">
      <Header
        right={
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <a href="/admin" className="btn-secondary px-3 py-1.5 text-xs">
                Dashboard
              </a>
            )}
            <SignOutButton />
          </div>
        }
      />
      <main className="mx-auto max-w-4xl px-6 pt-8">
        <FormClient
          categories={crops as CropCategory[]}
          lguSlug={lgu!.slug}
          lguName={lgu!.name}
          respondentEmail={session.user.email}
        />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
