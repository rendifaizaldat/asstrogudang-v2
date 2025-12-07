// app/(dashboard)/vendor/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-vendors";

// 1. GET VENDORS
export async function getVendors(search: string = "") {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  try {
    // Gunakan POST 'get' ke Edge Function agar aman (Admin Only)
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "get" }),
    });

    if (!response.ok) {
      console.error("Gagal ambil vendor:", await response.text());
      return [];
    }

    const vendors = await response.json();

    // Filter Client-Side (karena backend return all)
    if (search) {
      const lowerSearch = search.toLowerCase();
      return vendors.filter(
        (v: any) =>
          v.nama_vendor.toLowerCase().includes(lowerSearch) ||
          (v.bank && v.bank.toLowerCase().includes(lowerSearch)) ||
          (v.atas_nama && v.atas_nama.toLowerCase().includes(lowerSearch))
      );
    }

    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

// 2. SAVE VENDOR (ADD / UPDATE)
export async function saveVendor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  const id = formData.get("id") as string;
  const isEditing = !!id;

  const payload: any = {
    nama_vendor: formData.get("nama_vendor"),
    bank: formData.get("bank"),
    rekening: formData.get("rekening"),
    atas_nama: formData.get("atas_nama"),
  };

  if (isEditing) {
    payload.id = id;
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: isEditing ? "update" : "add",
        payload: payload,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal menyimpan vendor.");
    }

    revalidatePath("/vendor");
    revalidatePath("/hutang"); // Revalidate hutang karena nama vendor mungkin berubah
    return {
      success: true,
      message: isEditing ? "Vendor diperbarui" : "Vendor ditambahkan",
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 3. DELETE VENDOR
export async function deleteVendor(id: string, namaVendor: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        // Backend butuh nama_vendor untuk cek relasi hutang sebelum hapus
        payload: { id, nama_vendor: namaVendor },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Error dari backend biasanya: "Vendor tidak bisa dihapus karena masih digunakan..."
      throw new Error(result.error || "Gagal menghapus vendor.");
    }

    revalidatePath("/vendor");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
