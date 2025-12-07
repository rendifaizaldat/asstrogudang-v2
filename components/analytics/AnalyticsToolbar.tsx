// components/analytics/AnalyticsToolbar.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateAnalyticsReport } from "@/utils/pdfGenerator";

export default function AnalyticsToolbar({ data }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default tanggal: 30 hari terakhir
  const defaultEnd = new Date().toISOString().split("T")[0];
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const defaultStart = d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || defaultStart
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || defaultEnd
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleApply = () => {
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.push(`/analytics?${params.toString()}`);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const htmlContent = generateAnalyticsReport(
        data.summary,
        data.topProducts,
        data.period
      );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Analytics Report</title></head>
            <body onload="window.print()">${htmlContent}</body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      alert("Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-slate-400">-</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleApply}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Terapkan
        </button>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-500/20 disabled:opacity-50"
      >
        {isExporting ? "Memproses..." : "📄 Export Laporan P&L"}
      </button>
    </div>
  );
}
