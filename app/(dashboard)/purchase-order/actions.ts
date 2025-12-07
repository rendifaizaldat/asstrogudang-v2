// app/(dashboard)/purchase-order/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-transactions";

export async function submitPurchaseOrder(data: any) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Sesi habis. Silakan login kembali." };
  }

  try {
    // FIX: Sesuaikan struktur payload agar 100% sama dengan aplikasi lama (Vanilla JS)
    // Backend mengharapkan 'harga_jual', bukan 'price_per_unit'
    const itemsPayload = data.items.map((item: any) => ({
      product_id: item.id,
      nama: item.nama, // Kirim nama juga untuk jaga-jaga
      qty: Number(item.qty),
      harga_jual: Number(item.harga_jual), // <-- INI KUNCINYA
      // Backend akan menghitung total sendiri, tapi kita kirim data mentah yang benar
    }));

    // Hitung total di sini hanya untuk validasi/log, backend punya logika sendiri
    const estimatedTotal = itemsPayload.reduce(
      (acc: number, curr: any) => acc + curr.qty * curr.harga_jual,
      0
    );

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create_purchase_order",
        outlet: data.outlet,
        tanggalKirim: data.tanggalKirim,
        items: itemsPayload,
        // Kirim total eksplisit jika backend membutuhkannya langsung dari request body
        total_tagihan: estimatedTotal,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal menyimpan PO.");
    }

    revalidatePath("/purchase-order");
    revalidatePath("/");
    return { success: true, message: result.message };
  } catch (error: any) {
    return { error: error.message };
  }
}
