// components/produk/ProductSearch.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State lokal untuk input (agar responsif saat mengetik)
  const [query, setQuery] = useState(searchParams.get("search") || "");

  // Effect: Debounce Search
  useEffect(() => {
    // Set timer untuk menunggu user berhenti mengetik
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set("search", query);
      } else {
        params.delete("search"); // Hapus param jika kosong (otomatis load all)
      }

      // Reset ke halaman 1 setiap kali kata kunci berubah
      params.set("page", "1");

      // Update URL (ini akan men-trigger Server Component untuk fetch ulang data)
      router.replace(`${pathname}?${params.toString()}`);
    }, 500); // Delay 500ms

    // Cleanup timer jika user mengetik lagi sebelum 500ms
    return () => {
      clearTimeout(handler);
    };
  }, [query, router, pathname]); // Hapus searchParams dari dependency agar tidak loop

  return (
    <div className="relative flex-1 group">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau kode produk..."
        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-slate-700"
      />

      {/* Icon Kaca Pembesar */}
      <span className="absolute left-4 top-3.5 text-slate-400 text-lg group-focus-within:text-indigo-500 transition-colors">
        🔍
      </span>

      {/* Tombol Clear (X) - Muncul jika ada teks */}
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-3.5 text-slate-300 hover:text-red-500 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
          title="Hapus pencarian"
        >
          ✕
        </button>
      )}
    </div>
  );
}
