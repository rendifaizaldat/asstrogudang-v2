// app/(dashboard)/layout.tsx
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nama, role, outlet")
    .eq("id", user.id)
    .single();

  const userData = {
    ...user,
    ...profile,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (Sekarang menerima userData) */}
      <Sidebar user={userData} />

      <div className="ml-64 transition-all duration-300 ease-in-out flex flex-col min-h-screen">
        <Header user={userData} />
        <main className="p-8 flex-1">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
