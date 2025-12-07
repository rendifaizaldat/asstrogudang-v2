// app/(dashboard)/piutang/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import { revalidatePath } from "next/cache";

const EDGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

// 1. GET DATA (Updated: Via Edge Function)
export async function getPiutangData(
  params: {
    startDate?: string;
    endDate?: string;
    search?: string;
    status?: string;
    outlet?: string;
  } = {}
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const end = params.endDate ? new Date(params.endDate) : new Date();
  const start = params.startDate
    ? new Date(params.startDate)
    : new Date(new Date().setDate(end.getDate() - 30));

  try {
    // Fetch data dasar dari Edge Function (Bypass RLS)
    const response = await fetch(`${EDGE_URL}/get-transactions-data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "piutang",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        search: params.search || "",
        status: params.status || "all",
      }),
    });

    if (!response.ok) {
      console.error("Gagal fetch piutang:", await response.text());
      return [];
    }

    let data = await response.json();

    // FILTER OUTLET (Client-side filtering di Server Action)
    if (params.outlet && params.outlet !== "all") {
      const targetOutlet = params.outlet.toLowerCase();
      data = data.filter(
        (item: any) => (item.outlet_name || "").toLowerCase() === targetOutlet
      );
    }

    return data;
  } catch (error) {
    console.error("Error Action Piutang:", error);
    return [];
  }
}

// 2. GET OUTLETS LIST (FIXED: Menggunakan Edge Function untuk Bypass RLS)
export async function getOutletsList() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  try {
    // Kita ambil data transaksi dengan rentang waktu yang sangat panjang (misal 5 tahun ke belakang)
    // tujuannya untuk mendapatkan SEMUA nama outlet yang pernah bertransaksi.
    const end = new Date().toISOString();
    const start = new Date(
      new Date().setFullYear(new Date().getFullYear() - 5)
    ).toISOString();

    const response = await fetch(`${EDGE_URL}/get-transactions-data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "piutang",
        startDate: start,
        endDate: end,
        search: "",
        status: "all",
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();

    // Ekstrak nama outlet yang unik dari seluruh data transaksi
    const uniqueOutlets = Array.from(
      new Set(data.map((item: any) => item.outlet_name))
    )
      .filter((name) => name && typeof name === "string" && name.trim() !== "") // Hapus nama kosong/null
      .sort();

    return uniqueOutlets as string[];
  } catch (error) {
    console.error("Gagal load outlets:", error);
    return [];
  }
}

// 3. UPDATE STATUS
export async function toggleStatusPiutang(id: number, currentStatus: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  const newStatus =
    currentStatus.toLowerCase() === "lunas" ? "Belum Lunas" : "Lunas";

  try {
    const response = await fetch(`${EDGE_URL}/manage-transactions`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update-status",
        type: "piutang",
        id,
        newStatus,
      }),
    });

    if (!response.ok) throw new Error("Gagal update status.");

    revalidatePath("/piutang");
    return { success: true, newStatus };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 4. DELETE PIUTANG (REVISI ROBUST)
export async function deletePiutang(id: number) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const response = await fetch(`${EDGE_URL}/manage-transactions`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "piutang", id }),
    });

    // Baca response text dulu untuk debugging jika gagal
    const responseText = await response.text();

    if (!response.ok) {
      console.error("Delete failed:", responseText);
      // Coba parse error message dari backend jika ada
      try {
        const errJson = JSON.parse(responseText);
        return {
          error: errJson.error || "Gagal menghapus data (Server Error).",
        };
      } catch {
        return { error: "Gagal menghapus data: " + responseText };
      }
    }

    // Jika sukses
    revalidatePath("/piutang");
    return { success: true };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { error: error.message };
  }
}

// 5. UPLOAD BUKTI
export async function uploadBuktiPiutang(formData: FormData) {
  const supabase = await createClient();
  try {
    const file = formData.get("file") as File;
    const id = formData.get("id") as string;

    if (!file || !id) return { error: "Data tidak lengkap" };

    const fileName = `bukti-piutang-${Date.now()}-${file.name.replace(
      /[^a-z0-9.]/gi,
      "_"
    )}`;

    const { error: uploadError } = await supabase.storage
      .from("bukti-transfer")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("bukti-transfer").getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from("receivables")
      .update({
        bukti_transfer: publicUrl,
        status: "Lunas",
      })
      .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath("/piutang");
    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 6. GET DETAIL (Untuk Edit Modal)
export async function getPiutangDetail(id: number) {
  const { data, error } = await fetchEdgeData("manage-transactions", {
    type: "piutang",
    id: id,
  });

  if (error) return { error };
  const detail = Array.isArray(data) ? data[0] : data;
  return { data: detail };
}

// 7. UPDATE FULL TRANSACTION
export async function updatePiutang(id: number, headerData: any, items: any[]) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const response = await fetch(`${EDGE_URL}/manage-transactions`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update-full-transaction",
        transactionId: id,
        transactionType: "piutang",
        newHeaderData: headerData,
        newItems: items,
      }),
    });

    if (!response.ok) throw new Error("Gagal update transaksi.");

    revalidatePath("/piutang");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
