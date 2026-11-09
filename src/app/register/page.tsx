import Header from "@/components/Header";
import RegisterClient from "@/components/RegisterClient";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <RegisterClient />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
