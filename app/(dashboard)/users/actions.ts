// app/(dashboard)/users/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/manage-users";

// 1. GET USERS
export async function getUsers(search: string = "") {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  try {
    // Kita gunakan POST dengan action 'get' sesuai pola legacy
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "get" }),
    });

    if (!response.ok) {
      console.error("Gagal ambil user:", await response.text());
      return [];
    }

    const users = await response.json();

    // Filter Client-Side (karena backend legacy return all)
    if (search) {
      const lowerSearch = search.toLowerCase();
      return users.filter(
        (u: any) =>
          u.nama.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch) ||
          (u.outlet && u.outlet.toLowerCase().includes(lowerSearch))
      );
    }

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// 2. SAVE USER (ADD / UPDATE)
export async function saveUser(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Sesi habis." };

  const id = formData.get("id") as string;
  const isEditing = !!id;

  const payload: any = {
    nama: formData.get("nama"),
    email: formData.get("email"),
    outlet: formData.get("outlet"),
    role: formData.get("role"),
  };

  const password = formData.get("password") as string;

  // Logic Password:
  // - Kalau Mode Add: Wajib kirim password
  // - Kalau Mode Edit: Kirim hanya jika diisi (ganti password)
  if (!isEditing || (isEditing && password)) {
    payload.password = password;
  }

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
      throw new Error(result.error || "Gagal menyimpan pengguna.");
    }

    revalidatePath("/users");
    return {
      success: true,
      message: isEditing ? "Pengguna diperbarui" : "Pengguna ditambahkan",
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

// 3. DELETE USER
export async function deleteUser(id: string) {
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
        payload: { id },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal menghapus pengguna.");
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
