// app/login/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Ambil data dari form
  const loginInput = formData.get("identity") as string;
  const password = formData.get("password") as string;
  let email = loginInput;

  // 1. Logika Cek Username vs Email (Migrasi dari js/auth.js)
  if (!loginInput.includes("@")) {
    // Jika tidak ada @, asumsikan ini Nama Outlet/Username
    // Kita cari email aslinya di tabel 'users'
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("email")
      .eq("nama", loginInput)
      .single();

    if (profileError || !userProfile) {
      return { error: "Nama pengguna tidak ditemukan." };
    }

    email = userProfile.email;
  }

  // 2. Proses Login ke Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Password salah atau akun bermasalah." };
  }

  // 3. Revalidate & Redirect
  revalidatePath("/", "layout");
  redirect("/");
}
