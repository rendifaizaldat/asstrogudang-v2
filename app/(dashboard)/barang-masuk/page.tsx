// app/(dashboard)/barang-masuk/page.tsx
import { fetchEdgeData } from "@/utils/supabase/api";
import { createClient } from "@/utils/supabase/server";
import BarangMasukForm from "./BarangMasukForm";

export default async function BarangMasukPage() {
  const supabase = await createClient();

  // 1. Ambil Data Produk (Direct DB Select - Biasanya Public/Authenticated Read)
  // Kita perlu harga beli juga (jika ada kolomnya), untuk default value
  const { data: products } = await supabase
    .from("products")
    .select("id, nama, kode_produk, unit, sisa_stok, harga_jual, harga_beli")
    .order("nama", { ascending: true });

  // 2. Ambil Data Vendor (Via Edge Function 'get-admin-data' atau 'manage-vendors')
  // Di sistem lama, data vendor dimuat di awal (app.js loadInitialData -> get-admin-data)
  // Kita coba ambil dari 'get-admin-data' agar konsisten
  const { data: adminData } = await fetchEdgeData("get-admin-data");

  // Fallback: Jika adminData null, coba direct select (siapa tahu RLS mengizinkan)
  let vendors = adminData?.vendors || [];

  if (vendors.length === 0) {
    const { data: dbVendors } = await supabase
      .from("vendors")
      .select("id, nama_vendor");
    if (dbVendors) vendors = dbVendors;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Barang Masuk</h2>
        <p className="text-slate-500">
          Catat penerimaan barang dari vendor (Hutang Dagang).
        </p>
      </div>

      <BarangMasukForm products={products || []} vendors={vendors} />
    </div>
  );
}
