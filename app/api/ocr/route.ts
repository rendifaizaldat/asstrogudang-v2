// app/api/ocr/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    // Kita terima context vendor yang dipilih user (opsional, untuk membantu AI jika perlu)
    const contextVendor = (formData.get("vendorName") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "File wajib diupload" },
        { status: 400 }
      );
    }

    // 1. Ambil Data Produk Saja (Vendor list tidak wajib lagi karena user isi manual)
    const { data: products } = await supabase
      .from("products")
      .select("id, nama, kode_produk, unit, harga_beli")
      .eq("is_archived", false);

    // Format ringkas: ID|Nama|Kode
    const listProduk =
      products
        ?.map((p) => `ID:${p.id}|${p.nama}|${p.kode_produk || ""}`)
        .join("\n") || "";

    // 2. Image Processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const processedImage = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .toBuffer();

    const base64Image = processedImage.toString("base64");

    // 3. Konfigurasi Model (Gunakan model terbaik Anda)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // Atau 'gemini-1.5-flash-latest' jika 2.5 belum stabil
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Anda adalah asisten input item gudang. 
      Tugas: Ekstrak LIST BARANG dari gambar nota ini. 
      Hiraukan Header (Nama Toko/Tanggal) jika tidak jelas atau terpotong. Fokus ke tabel barang.

      === KONTEKS ===
      Vendor Terpilih (User Input): ${contextVendor} (Gunakan ini sebagai petunjuk jenis barang)
      
      DATABASE PRODUK KAMI:
      ${listProduk}
      ===============

      INSTRUKSI ITEM:
      1. Baca setiap baris barang di gambar.
      2. Cari produk yang COCOK di "DATABASE PRODUK KAMI".
      3. Jika cocok, ambil "product_id". Jika tidak, "product_id" = null.
      4. Ambil qty dan harga (bersihkan dari simbol mata uang).

      OUTPUT JSON:
      {
        "items": [
          {
            "product_id": Number (or null),
            "nama_di_nota": "String asli",
            "qty": Number,
            "harga_satuan": Number
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
        error: `AI Error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
