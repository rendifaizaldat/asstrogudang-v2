// app/(dashboard)/produk/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import { revalidatePath } from "next/cache";

const FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

// 1. GET PRODUCTS (Paginated & Search)
export async function getProducts(
  page: number = 1,
  limit: number = 20,
  search: string = ""
) {
  // Kita gunakan endpoint yang sama dengan katalog legacy untuk konsistensi
  const { data, error } = await fetchEdgeData("manage-products", {
    page,
    limit,
    search,
  });

  if (error) {
    console.error("Gagal ambil produk:", error);
    return { products: [], total: 0 };
  }

  return {
    products: data.products || [],
    total: data.total_products || 0,
  };
}

// 2. ADD PRODUCT
export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const payload = {
      nama: formData.get("nama"),
      kode_produk: formData.get("kode_produk"),
      unit: formData.get("unit"),
      harga_beli: Number(formData.get("harga_beli")),
      harga_jual: Number(formData.get("harga_jual")), // Opsional, bisa auto +5% di UI
      sisa_stok: Number(formData.get("stok_awal")) || 0,
      foto: formData.get("foto_url") || "",
    };

    // Gunakan endpoint manage-products (POST)
    const response = await fetch(`${FUNCTION_URL}/manage-products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gagal tambah produk");

    revalidatePath("/produk");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 3. UPDATE PRODUCT
export async function updateProduct(id: number, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const updates = {
      nama: formData.get("nama"),
      unit: formData.get("unit"),
      harga_beli: Number(formData.get("harga_beli")),
      harga_jual: Number(formData.get("harga_jual")),
      foto: formData.get("foto_url"),
    };

    const payload = {
      productId: id,
      updates: updates,
    };

    const response = await fetch(`${FUNCTION_URL}/manage-products`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gagal update produk");

    revalidatePath("/produk");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 4. DELETE (ARCHIVE) PRODUCT
export async function deleteProduct(id: number) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const response = await fetch(`${FUNCTION_URL}/manage-products`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId: id }),
    });

    if (!response.ok) throw new Error("Gagal menghapus produk.");

    revalidatePath("/produk");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 5. UPDATE STOCK (Manual Adjustment / Opname)
export async function updateStock(id: number, newStock: number) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const payload = {
      productId: id,
      updates: { sisa_stok: newStock },
    };

    const response = await fetch(`${FUNCTION_URL}/manage-products`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Gagal update stok.");

    revalidatePath("/produk");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 6. GET STOCK HISTORY
export async function getStockHistory(productId: number) {
  const { data, error } = await fetchEdgeData("get-stock-history", {
    product_id: productId,
  });

  if (error) return { error };
  return { data: data || [] };
}
