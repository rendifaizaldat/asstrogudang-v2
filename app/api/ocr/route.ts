// app/api/ocr/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
    const [vendorsRes, productsRes] = await Promise.all([
      supabase.from("vendors").select("id, nama_vendor"),
      supabase
        .from("products")
        .select("id, nama, kode_produk, unit, harga_beli")
        .eq("is_archived", false),
    ]);

    // Format data agar hemat token tapi informatif bagi AI
    const listVendor =
      vendorsRes.data?.map((v) => v.nama_vendor).join(", ") || "";
    const listProduk =
      productsRes.data?.map((p) => `ID:${p.id}|${p.nama}`).join("\n") || "";

    // 3. Image Pre-processing dengan Sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const processedImage = await sharp(buffer)
      .grayscale() // Ubah ke hitam putih
      .normalize() // Perbaiki kontras otomatis
      .sharpen({ sigma: 1.5 }) // Pertajam teks
      .toBuffer();

    const base64Image = processedImage.toString("base64");

    // 4. Kirim ke Gemini dengan Context-Augmented Prompt
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Analisis gambar nota ini dan cocokkan itemnya dengan database kami.

      === DATABASE REFERENSI ===
      VENDORS: [${listVendor}]
      PRODUCTS (ID|NAMA):
      ${listProduk}
      ==========================

      INSTRUKSI:
      1. VENDOR: Cari nama vendor di nota. Jika mirip dengan salah satu di "VENDORS", ambil nama tersebut persis.
      2. ITEM: Untuk setiap baris barang:
         - Baca nama barang di nota.
         - Cari produk yang PALING MIRIP di daftar "PRODUCTS".
         - Ambil "product_id" dari ID produk yang cocok. 
         - Jika tidak ada yang cocok, "product_id" = null.
         - Ambil qty dan harga satuan (bersihkan dari mata uang/satuan).

      OUTPUT JSON (MURNI):
      {
        "vendor_match": "Nama Vendor" (atau null),
        "no_nota": "Nomor Nota" (atau null),
        "tanggal": "YYYY-MM-DD" (atau null),
        "items": [
          {
            "product_id": Number (ID dari database atau null),
            "qty": Number,
            "harga_satuan": Number,
            "nama_di_nota": "String asli"
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
      { error: error.message || "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
