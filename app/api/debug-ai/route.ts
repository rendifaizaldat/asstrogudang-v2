import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key not found" }, { status: 500 });
  }

  try {
    // Kita tembak langsung endpoint REST Google untuk melihat daftar model yang tersedia
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET" }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Filter hanya model yang support "generateContent" (bisa chat/vision)
    const validModels = data.models
      ?.filter((m: any) =>
        m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m: any) => m.name);

    return NextResponse.json({
      message: "Berikut adalah model yang VALID untuk API Key Anda:",
      available_models: validModels,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
