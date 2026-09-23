import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return (
    <div className="min-h-screen">
      <Header eyebrow="PSA Region IV-A — Administrator view" right={<SignOutButton />} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AdminClient />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
