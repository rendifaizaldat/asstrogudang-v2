// components/dashboard/DashboardFilter.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default: mode 'monthly' (Bulan berjalan)
  const [mode, setMode] = useState<"daily" | "monthly" | "yearly">("monthly");

  // State nilai filter
  const [date, setDate] = useState(
    searchParams.get("date") || new Date().toISOString().split("T")[0]
  );
  const [month, setMonth] = useState(
    searchParams.get("month") || String(new Date().getMonth() + 1)
  );
  const [year, setYear] = useState(
    searchParams.get("year") || String(new Date().getFullYear())
  );

  // Effect: Update URL saat filter berubah
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("mode", mode);

    if (mode === "daily") {
      params.set("date", date);
    } else if (mode === "monthly") {
      params.set("month", month);
      params.set("year", year);
    } else if (mode === "yearly") {
      params.set("year", year);
    }

    router.push(`/?${params.toString()}`);
  }, [mode, date, month, year, router]);

  return (
    <div className="flex flex-wrap gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/10">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as any)}
        className="bg-white border-slate-200 text-slate-800 text-black text-sm rounded-lg px-3 py-2 border border-black/10 outline-none focus:border-primary"
      >
        <option value="daily">📅 Harian</option>
        <option value="monthly">📆 Bulanan</option>
        <option value="yearly">🗓️ Tahunan</option>
      </select>

      {mode === "daily" && (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-white border-slate-200 text-slate-800 text-black text-sm rounded-lg px-3 py-2 border border-black/10 outline-none"
        />
      )}

      {mode === "monthly" && (
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-white border-slate-200 text-slate-800 text-black text-sm rounded-lg px-3 py-2 border border-black/10 outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>
      )}

      {(mode === "monthly" || mode === "yearly") && (
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-white border-slate-200 text-slate-800 text-black text-sm rounded-lg px-3 py-2 border border-black/10 outline-none"
        >
          {Array.from(
            { length: 5 },
            (_, i) => new Date().getFullYear() - i
          ).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
