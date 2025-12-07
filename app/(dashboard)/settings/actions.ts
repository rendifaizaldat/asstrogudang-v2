// app/(dashboard)/settings/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. GET SETTINGS
export async function getSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return null;
  return data;
}

// 2. UPDATE SETTINGS
export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  // Data Text
  const updates: any = {
    company_name: formData.get("company_name"),
    company_address: formData.get("company_address"),
    signer_name: formData.get("signer_name"),
    // Field Baru:
    invoice_footer_text: formData.get("invoice_footer_text"),
    report_header_subtext: formData.get("report_header_subtext"),

    updated_at: new Date().toISOString(),
  };

  // Helper Upload
  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("company-assets")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from("company-assets")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  try {
    const logoFile = formData.get("logo_file") as File;
    const signatureFile = formData.get("signature_file") as File;

    if (logoFile && logoFile.size > 0) {
      updates.company_logo_url = await uploadFile(logoFile, "logo");
    }
    if (signatureFile && signatureFile.size > 0) {
      updates.signature_url = await uploadFile(signatureFile, "signature");
    }

    const { error } = await supabase
      .from("settings")
      .upsert({ id: 1, ...updates });

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true, message: "Pengaturan berhasil disimpan." };
  } catch (error: any) {
    return { error: error.message };
  }
}
