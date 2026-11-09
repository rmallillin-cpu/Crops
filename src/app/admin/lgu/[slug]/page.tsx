import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import LguResponsesEditor from "@/components/LguResponsesEditor";
import { getLguBySlug } from "@/lib/lgus";
import { getLguResponses } from "@/lib/sheets";
import { notFound } from "next/navigation";

export default async function LguDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const lgu = getLguBySlug(params.slug);
  if (!lgu) notFound();

  const responses = await getLguResponses(lgu.slug);

  return (
    <div className="min-h-screen">
      <Header eyebrow="PSA Region IV-A — Administrator view" right={<SignOutButton />} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/admin" className="text-xs text-cavite-blue hover:underline">
          ← Back to dashboard
        </Link>
        <LguResponsesEditor lguSlug={lgu.slug} lguName={lgu.name} initial={responses} />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
