// app/(dashboard)/piutang/page.tsx
import { getPiutangData } from "./actions";
import { getSettings } from "@/app/(dashboard)/settings/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PiutangList from "@/components/piutang/PiutangList";
import PiutangToolbar from "@/components/piutang/PiutangToolbar";

export const dynamic = "force-dynamic";

export default async function PiutangPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // 1. Cek User Profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, outlet")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "user";
  const userOutlet = profile?.outlet || "";

  // 2. Fetch Data Paralel (TAMBAHKAN FETCH PRODUCTS)
  const [piutangData, settings, productsRes] = await Promise.all([
    getPiutangData({
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
      status: params.status,
      outlet: userRole === "admin" ? params.outlet : userOutlet,
    }),
    getSettings(),
    // Ambil produk ringkas untuk dropdown edit
    supabase
      .from("products")
      .select("id, nama, kode_produk, unit, harga_jual")
      .eq("is_archived", false)
      .order("nama"),
  ]);

  const products = productsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Piutang Outlet</h2>
        <p className="text-slate-500 text-sm">
          {userRole === "admin"
            ? "Monitor tagihan penjualan dan status pembayaran outlet."
            : "Riwayat tagihan dan pembayaran outlet Anda."}
        </p>
      </div>

      <PiutangToolbar
        data={piutangData}
        settings={settings}
        userRole={userRole}
        userOutlet={userOutlet}
      />

      {/* PASS PRODUCTS KE LIST */}
      <PiutangList
        data={piutangData}
        settings={settings}
        userRole={userRole}
        products={products}
      />
    </div>
  );
}
