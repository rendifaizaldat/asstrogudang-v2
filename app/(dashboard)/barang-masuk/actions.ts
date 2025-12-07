// app/(dashboard)/barang-masuk/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-transactions";
const PRODUCT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-products";

// 1. Fungsi Simpan Barang Masuk
export async function submitBarangMasuk(data: any) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "Sesi habis." };

  try {
    // Mapping payload
    const itemsPayload = data.items.map((item: any) => ({
      id_barang: item.id,
      qty: Number(item.qty),
      harga: Number(item.harga_beli),
      total: Number(item.qty) * Number(item.harga_beli),
    }));

    const payload = {
      action: "process-incoming-goods",
      vendor: { nama_vendor: data.vendor },
      noNota: data.noNota,
      tanggalNota: data.tanggalNota,
      tanggalJatuhTempo: data.tanggalJatuhTempo,
      items: itemsPayload,
    };

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal menyimpan Barang Masuk.");
    }

    revalidatePath("/barang-masuk");
    revalidatePath("/");
    return { success: true, message: result.message };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 2. Fungsi Cek Duplikasi Invoice
export async function checkInvoiceExists(vendor: string, noNota: string) {
  const supabase = await createClient();

  // Cek manual ke tabel payables (hutang)
  const { data, error } = await supabase
    .from("payables")
    .select("id")
    .eq("nama_vendor", vendor)
    .eq("no_nota_vendor", noNota)
    .maybeSingle();

  if (error) return { error: error.message };
  return { exists: !!data };
}

// 3. Fungsi Quick Add Product
export async function quickAddProduct(productData: any) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { error: "Sesi habis." };

  try {
    const payload = {
      nama: productData.nama,
      kode_produk: productData.kode,
      unit: productData.unit,
      harga_beli: Number(productData.harga_beli),
      harga_jual: Number(productData.harga_jual),
      sisa_stok: 0,
      foto: "",
    };

    const response = await fetch(PRODUCT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gagal tambah produk");

    revalidatePath("/barang-masuk");
    return { success: true, product: result.data || result };
  } catch (error: any) {
    return { error: error.message };
  }
}
