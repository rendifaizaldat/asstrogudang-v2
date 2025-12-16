// app/(dashboard)/purchase-order/page.tsx
import { createClient } from "@/utils/supabase/server";
import PurchaseOrderForm from "./PurchaseOrderForm";
import { getOutletsFromUsers } from "./outlet.actions";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderPage() {
  const supabase = await createClient();

  // 1. Cek User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, outlet")
    .eq("id", user.id)
    .single();

  // 2. Ambil Master Produk
  const { data: products } = await supabase
    .from("products")
    .select("id, nama, kode_produk, unit, sisa_stok, harga_jual")
    .eq("is_archived", false)
    .order("nama");

  // 3. Ambil Daftar Outlet (Hanya jika Admin)
  const isAdmin = profile?.role === "admin";
  let outlets: string[] = [];

  if (isAdmin) {
    outlets = await getOutletsFromUsers();
  } else {
    // Jika user, outlet list hanya berisi outlet dia sendiri
    outlets = profile?.outlet ? [profile.outlet] : [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Purchase Order</h2>
        <p className="text-slate-500 text-sm">
          Buat pesanan barang baru untuk outlet.
        </p>
      </div>

      <PurchaseOrderForm
        products={products || []}
        outlets={outlets}
        userRole={profile?.role || "user"} // Pass role ke Client Component
        userOutlet={profile?.outlet} // Pass outlet user (NEW PROP)
      />
    </div>
  );
}
