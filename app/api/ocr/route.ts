// app/api/ocr/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Kita tetap pakai SDK ini
import sharp from "sharp";

// 1. Inisialisasi Klien
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gunakan Service Role Key untuk bypass RLS (karena ini API system-level)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File wajib diupload" },
        { status: 400 }
      );
    }

    // 2. Ambil "Contekkan" Data Master (Context) dari Supabase
    // Menggunakan list lengkap agar AI 'Pro' bisa berpikir lebih dalam
    const [vendorsRes, productsRes] = await Promise.all([
      supabase.from("vendors").select("id, nama_vendor"),
      supabase
        .from("products")
        .select("id, nama, kode_produk, unit, harga_beli")
        .eq("is_archived", false),
    ]);

    const listVendor =
      vendorsRes.data?.map((v) => v.nama_vendor).join(", ") || "";
    // Format ringkas: ID|Nama|Kode
    const listProduk =
      productsRes.data
        ?.map((p) => `ID:${p.id}|${p.nama}|${p.kode_produk || ""}`)
        .join("\n") || "";

    // 3. Image Pre-processing dengan Sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const processedImage = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .toBuffer();

    const base64Image = processedImage.toString("base64");

    // 4. Kirim ke Gemini PRO (Karena akun Anda Pro)
    // Model 'gemini-1.5-pro' jauh lebih akurat untuk handwriting & layout kompleks
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Anda adalah mesin OCR data entry yang sangat teliti. 
      Tugas: Ekstrak data dari nota, perbaiki typo, dan cocokan dengan database master.

      === MASTER DATA ===
      VENDORS: [${listVendor}]
      PRODUCTS:
      ${listProduk}
      ===================

      INSTRUKSI KHUSUS:
      1. VENDOR: Jika nama di nota mirip dengan Master Vendor, gunakan nama Master.
      2. ITEM PRODUK:
         - Baca baris per baris.
         - Cocokkan nama barang di nota dengan "PRODUCTS" menggunakan fuzzy logic (kemiripan).
         - Prioritaskan kecocokan pada Kode Produk jika ada.
         - Jika cocok, isi "product_id" dengan ID dari Master.
         - Jika TIDAK cocok sama sekali, biarkan "product_id" null, tapi tetap ambil nama aslinya.
      3. ANGKA: Pastikan qty dan harga dikonversi ke number murni (buang 'Rp', 'pcs', '.', ',').

      OUTPUT JSON FORMAT:
      {
        "vendor_match": "Nama Vendor Master" (or null),
        "no_nota": "String",
        "tanggal": "YYYY-MM-DD" (convert if needed),
        "items": [
          {
            "product_id": Number (or null),
            "nama_di_nota": "String asli di gambar",
            "matched_nama": "Nama di Master Product" (or null),
            "qty": Number,
            "harga_satuan": Number,
            "subtotal": Number
          }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
    ]);

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Terjadi kesalahan pada sistem AI",
      },
      { status: 500 }
    );
  }
}
