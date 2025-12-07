// components/hutang/HutangToolbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { generateHutangReport } from "@/utils/pdfGenerator";
import { getHutangData } from "@/app/(dashboard)/hutang/actions";

interface Props {
  data: any[];
}

export default function HutangToolbar({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      router.push(`/hutang?${params.toString()}`);
    }, 800);
    return () => clearTimeout(timeout);
  }, [startDate, endDate, search, status, router]);

  const handlePrintPDF = async () => {
    setIsExporting(true);
    try {
      const reportData = await getHutangData({
        startDate,
        endDate,
        search,
        status,
      });
      if (!reportData || reportData.length === 0) {
        alert("Tidak ada data untuk periode ini.");
        return;
      }
      const dateRangeStr = `${new Date(startDate).toLocaleDateString(
        "id-ID"
      )} - ${new Date(endDate).toLocaleDateString("id-ID")}`;
      const htmlContent = generateHutangReport(reportData, dateRangeStr);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Laporan Hutang</title></head><body onload="window.print()">${htmlContent}</body></html>`
        );
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
      alert("Gagal mencetak laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- EXPORT EXCEL FORMAT GRUP (HUTANG) ---
  const handleExportExcel = () => {
    const excelRows: any[] = [];

    data.forEach((trx) => {
      const date = new Date(trx.tanggal_nota).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Info Bank untuk Header
      const bankInfo = trx.bank ? `| ${trx.bank} - ${trx.rekening}` : "";

      // 1. Baris Header Vendor
      // Format: "Nama Vendor - No Nota - Tanggal [Status] | Bank..."
      const headerTitle = `${trx.nama_vendor} - ${
        trx.no_nota_vendor
      } - ${date} [${trx.status || "Belum Lunas"}] ${bankInfo}`;
      excelRows.push([headerTitle]);

      // 2. Baris Header Kolom Item
      excelRows.push([
        "Nama Barang",
        "Qty",
        "Satuan",
        "Harga Beli",
        "Subtotal",
      ]);

      // 3. Baris Item Barang
      if (trx.transaction_items && trx.transaction_items.length > 0) {
        trx.transaction_items.forEach((item: any) => {
          excelRows.push([
            item.products?.nama || "Item Dihapus",
            Number(item.quantity),
            item.products?.unit || "pcs",
            Number(item.price_per_unit),
            Number(item.subtotal),
          ]);
        });
      } else {
        excelRows.push(["-", 0, "-", 0, Number(trx.total_tagihan)]);
      }

      // 4. Baris Total per Nota
      excelRows.push(["", "", "", "TOTAL TAGIHAN:", Number(trx.total_tagihan)]);

      // 5. Baris Kosong Pemisah
      excelRows.push([]);
      excelRows.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

    // Styling Lebar Kolom
    worksheet["!cols"] = [
      { wch: 40 }, // A: Nama Barang
      { wch: 10 }, // B: Qty
      { wch: 10 }, // C: Unit
      { wch: 20 }, // D: Harga
      { wch: 20 }, // E: Subtotal
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Hutang");
    XLSX.writeFile(workbook, `Hutang_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm outline-none px-2 py-1 text-slate-700"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm outline-none px-2 py-1 text-slate-700"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[150px] text-slate-700"
        >
          <option value="all">Semua Status</option>
          <option value="Lunas">✅ Lunas</option>
          <option value="Belum Lunas">⏳ Belum Lunas</option>
        </select>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Cari Vendor / No. Nota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 border border-green-200 transition-colors"
        >
          📊 Excel Detail
        </button>
        <button
          onClick={handlePrintPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50"
        >
          {isExporting ? "Memuat..." : "🖨️ Cetak Laporan"}
        </button>
      </div>
    </div>
  );
}
