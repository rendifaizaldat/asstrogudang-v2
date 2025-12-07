// app/(dashboard)/hutang/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import { revalidatePath } from "next/cache";

const FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";
const EDGE_URL = FUNCTION_URL; // Alias

// 1. GET DATA (Cleaned Up: Percayakan pada Edge Function)
export async function getHutangData(
  params: {
    startDate?: string;
    endDate?: string;
    search?: string;
    status?: string;
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
    // Panggil Edge Function baru
    const response = await fetch(`${EDGE_URL}/get-transactions-data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "hutang",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        search: params.search || "",
        status: params.status || "all",
      }),
    });

    if (!response.ok) {
      console.error("Gagal fetch hutang:", await response.text());
      return [];
    }

    // Data dari Edge Function sudah matang (termasuk items & info bank)
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error Action Hutang:", error);
    return [];
  }
}

// ... (Sisa fungsi toggleStatusHutang, deleteHutang, dll di bawah ini JANGAN DIHAPUS) ...
// Copy-paste fungsi lain dari file sebelumnya agar tetap berfungsi normal.

export async function toggleStatusHutang(id: number, currentStatus: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };
  const newStatus =
    currentStatus.toLowerCase() === "lunas" ? "Belum Lunas" : "Lunas";
  try {
    const response = await fetch(`${FUNCTION_URL}/manage-transactions`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update-status",
        type: "hutang",
        id,
        newStatus,
      }),
    });
    if (!response.ok) throw new Error("Gagal update status.");
    revalidatePath("/hutang");
    return { success: true, newStatus };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteHutang(id: number) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };
  try {
    const response = await fetch(`${FUNCTION_URL}/manage-transactions`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "hutang", id }),
    });
    if (!response.ok) throw new Error("Gagal hapus.");
    revalidatePath("/hutang");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function uploadBuktiHutang(formData: FormData) {
  const supabase = await createClient();
  try {
    const file = formData.get("file") as File;
    const id = formData.get("id") as string;
    const fileName = `bukti-hutang-${Date.now()}-${file.name.replace(
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
    await supabase
      .from("payables")
      .update({ bukti_transfer: publicUrl, status: "Lunas" })
      .eq("id", id);
    revalidatePath("/hutang");
    return { success: true, url: publicUrl };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getHutangDetail(id: number) {
  const { data, error } = await fetchEdgeData("manage-transactions", {
    type: "hutang",
    id: id,
  });
  if (error) return { error };
  const detail = Array.isArray(data) ? data[0] : data;
  return { data: detail };
}

export async function updateHutang(id: number, headerData: any, items: any[]) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };
  try {
    const response = await fetch(`${FUNCTION_URL}/manage-transactions`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update-full-transaction",
        transactionId: id,
        transactionType: "hutang",
        newHeaderData: headerData,
        newItems: items,
      }),
    });
    if (!response.ok) throw new Error("Gagal update.");
    revalidatePath("/hutang");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
