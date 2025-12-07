// app/(dashboard)/history/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-transactions";

// Helper formatter tanggal untuk pencarian string
const formatDateSearch = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr)
    .toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toLowerCase();
};

// 1. GET ARCHIVED DATA (Updated dengan Search)
export async function getArchivedData(search: string = "") {
  // Ambil semua data arsip dari backend
  const { data, error } = await fetchEdgeData("get-archived-data");

  if (error) {
    console.error("Gagal ambil arsip:", error);
    return { payables: [], receivables: [] };
  }

  let payables = data.payables || [];
  let receivables = data.receivables || [];

  // Filter Logic
  if (search) {
    const lowerSearch = search.toLowerCase();

    // Filter Hutang (Payables)
    payables = payables.filter(
      (item: any) =>
        (item.nama_vendor &&
          item.nama_vendor.toLowerCase().includes(lowerSearch)) ||
        (item.no_nota_vendor &&
          item.no_nota_vendor.toLowerCase().includes(lowerSearch)) ||
        (item.total_tagihan &&
          String(item.total_tagihan).includes(lowerSearch)) ||
        (item.tanggal_nota &&
          formatDateSearch(item.tanggal_nota).includes(lowerSearch))
    );

    // Filter Piutang (Receivables)
    receivables = receivables.filter(
      (item: any) =>
        (item.outlet_name &&
          item.outlet_name.toLowerCase().includes(lowerSearch)) ||
        (item.invoice_id &&
          item.invoice_id.toLowerCase().includes(lowerSearch)) ||
        (item.total_tagihan &&
          String(item.total_tagihan).includes(lowerSearch)) ||
        (item.tanggal_pengiriman &&
          formatDateSearch(item.tanggal_pengiriman).includes(lowerSearch))
    );
  }

  return {
    payables,
    receivables,
  };
}

// 2. RESTORE TRANSACTION (Tetap Sama)
export async function restoreTransaction(
  id: number,
  type: "hutang" | "piutang"
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, id }),
    });

    if (!response.ok) {
      throw new Error("Gagal memulihkan data.");
    }

    revalidatePath("/history");
    revalidatePath("/hutang");
    revalidatePath("/piutang");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
