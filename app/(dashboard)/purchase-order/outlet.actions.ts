"use server";

import { createClient } from "@/utils/supabase/server";

export async function getOutletsFromUsers() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-outlets`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store", // ⬅️ penting
    }
  );

  if (!res.ok) {
    console.error("Gagal load outlets");
    return [];
  }

  return (await res.json()) as string[];
}
