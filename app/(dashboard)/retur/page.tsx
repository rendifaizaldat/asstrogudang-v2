// app/(dashboard)/retur/page.tsx
import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import ReturForm from "./ReturForm";

export default async function ReturPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id)
    .single();

  const role = userProfile?.role || "user";

  const { data: products } = await supabase
    .from("products")
    .select("id, nama, kode_produk, unit, sisa_stok, harga_jual")
    .order("nama", { ascending: true });

  let outlets: string[] = [];
  if (role === "admin") {
    const { data: outletData } = await fetchEdgeData("get-outlets");
    if (outletData) {
      outlets = outletData;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Retur Barang</h2>
        <p className="text-slate-500">
          Proses pengembalian barang dari outlet dan update stok otomatis.
        </p>
      </div>

      <ReturForm products={products || []} outlets={outlets} userRole={role} />
    </div>
  );
}
