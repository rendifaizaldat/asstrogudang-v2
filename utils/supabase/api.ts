// utils/supabase/api.ts
import { createClient } from "@/utils/supabase/server";

const FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

export async function fetchEdgeData(functionName: string, params: any = {}) {
  const supabase = await createClient();

  // 1. Ambil Session Token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Unauthorized: No session found", data: null };
  }

  try {
    // 2. Siapkan URL dengan Query Params
    const url = new URL(`${FUNCTION_URL}/${functionName}`);

    // Bersihkan params undefined/null agar tidak terkirim sebagai string "undefined"
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    // 3. Fetch ke Edge Function
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        // HAPUS Content-Type untuk GET request (ini penyebab Bad Request)
      },
      cache: "no-store",
    });

    // 4. Handle Response
    let result;
    try {
      // Coba parse JSON, jika gagal (kosong), anggap null
      result = await response.json();
    } catch (e) {
      result = null;
    }

    if (!response.ok) {
      // Ambil pesan error spesifik dari backend jika ada
      const errorMessage =
        result?.error || result?.message || response.statusText;
      throw new Error(errorMessage);
    }

    return { data: result, error: null };
  } catch (error: any) {
    console.error(`Edge Function '${functionName}' Failed:`, error.message);
    return { data: null, error: error.message };
  }
}
