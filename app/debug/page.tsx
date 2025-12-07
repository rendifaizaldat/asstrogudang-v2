// app/debug/page.tsx
import { createClient } from "@/utils/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();

  // 1. Cek Tabel Receivables (Piutang)
  const { data: piutang, error: errPiutang } = await supabase
    .from("receivables")
    .select("*")
    .limit(3);

  // 2. Cek Tabel Payables (Hutang)
  const { data: hutang, error: errHutang } = await supabase
    .from("payables")
    .select("*")
    .limit(3);

  // 3. Cek Tabel Products
  const { data: produk, error: errProduk } = await supabase
    .from("products")
    .select("*")
    .limit(3);

  return (
    <div className="p-10 bg-black min-h-screen text-green-400 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6 border-b border-green-800 pb-2">
        SYSTEM DEBUGGER
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PIUTANG */}
        <div className="border border-green-800 p-4 rounded bg-gray-900/50">
          <h2 className="font-bold text-lg mb-2">Tabel: receivables</h2>
          {errPiutang ? (
            <p className="text-red-500">ERROR: {errPiutang.message}</p>
          ) : (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(piutang, null, 2)}
            </pre>
          )}
        </div>

        {/* HUTANG */}
        <div className="border border-green-800 p-4 rounded bg-gray-900/50">
          <h2 className="font-bold text-lg mb-2">Tabel: payables</h2>
          {errHutang ? (
            <p className="text-red-500">ERROR: {errHutang.message}</p>
          ) : (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(hutang, null, 2)}
            </pre>
          )}
        </div>

        {/* PRODUK */}
        <div className="border border-green-800 p-4 rounded bg-gray-900/50 col-span-full">
          <h2 className="font-bold text-lg mb-2">Tabel: products</h2>
          {errProduk ? (
            <p className="text-red-500">ERROR: {errProduk.message}</p>
          ) : (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(produk, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
