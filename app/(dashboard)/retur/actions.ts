// app/(dashboard)/retur/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-returns";

export async function submitRetur(data: any) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Sesi habis. Silakan login kembali." };
  }

  try {
    // Payload disesuaikan dengan spesifikasi endpoint 'manage-returns' di sistem lama
    const payload = {
      header: {
        outlet: data.outlet, // Admin bisa pilih outlet, User biasa otomatis di backend
        tanggal: data.tanggal,
        catatan: data.catatan,
      },
      items: data.items.map((item: any) => ({
        product_id: item.id,
        quantity: Number(item.qty),
        price_per_unit: Number(item.harga_jual),
      })),
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
      throw new Error(
        result.error || result.message || "Gagal menyimpan Retur."
      );
    }

    revalidatePath("/retur");
    revalidatePath("/"); // Refresh dashboard (stok berubah)
    return { success: true, message: result.message };
  } catch (error: any) {
    return { error: error.message };
  }
}
