// components/history/ArchiveSearch.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ArchiveSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State lokal agar input responsif saat mengetik
  const [query, setQuery] = useState(searchParams.get("search") || "");

  // Effect: Debounce Search (Tunggu user berhenti mengetik 500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set("search", query);
      } else {
        params.delete("search"); // Hapus param jika kosong (auto load all)
      }

      // Update URL tanpa reload halaman (Server Action akan ter-trigger di page.tsx)
      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query, router, pathname, searchParams]);

  return (
    <div className="relative flex-1 group">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, tanggal, atau nominal..."
        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-slate-700 text-sm"
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
