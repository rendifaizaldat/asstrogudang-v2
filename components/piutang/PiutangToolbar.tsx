// components/piutang/PiutangToolbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { generateHTMLReport } from "@/utils/pdfGenerator";
import {
  getPiutangData,
  getOutletsList,
} from "@/app/(dashboard)/piutang/actions";

interface Props {
  data: any[];
  settings?: any;
  userRole: string; // <-- Props Baru
  userOutlet: string; // <-- Props Baru
}

export default function PiutangToolbar({
  data,
  settings,
  userRole,
  userOutlet,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = userRole === "admin";

  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  // Logic Outlet State: Jika user, default ke userOutlet. Jika admin, default 'all'.
  const [outlet, setOutlet] = useState(
    !isAdmin ? userOutlet : searchParams.get("outlet") || "all"
  );

  const [outletsList, setOutletsList] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch List Outlet (Hanya jika admin, untuk efisiensi)
  useEffect(() => {
    if (isAdmin) {
      getOutletsList().then((list) => setOutletsList(list));
    }
  }, [isAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      // Jika admin, ikuti state. Jika user, paksa userOutlet.
      if (isAdmin) {
        if (outlet && outlet !== "all") params.set("outlet", outlet);
      } else {
        params.set("outlet", userOutlet);
      }

      router.push(`/piutang?${params.toString()}`);
    }, 800);
    return () => clearTimeout(timeout);
  }, [startDate, endDate, search, status, outlet, router, isAdmin, userOutlet]);

  const handlePrintPDF = async () => {
    setIsExporting(true);
    try {
      const reportData = await getPiutangData({
        startDate,
        endDate,
        search,
        status,
        outlet: isAdmin ? outlet : userOutlet,
      });

      if (!reportData || reportData.length === 0) {
        alert("Tidak ada data untuk periode ini.");
        return;
      }

      const dateRangeStr = `${new Date(startDate).toLocaleDateString(
        "id-ID"
      )} - ${new Date(endDate).toLocaleDateString("id-ID")}`;
      const outletLabel = isAdmin
        ? outlet === "all"
          ? "Semua Outlet"
          : outlet
        : userOutlet;

      const htmlContent = generateHTMLReport(
        reportData,
        [],
        outletLabel,
        dateRangeStr,
        settings
      );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Laporan Piutang</title></head><body onload="window.print()">${htmlContent}</body></html>`
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

  const handleExportExcel = () => {
    const excelRows: any[] = [];
    data.forEach((trx) => {
      const date = new Date(
        trx.tanggal_pengiriman || trx.created_at
      ).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const headerTitle = `${trx.outlet_name} - ${trx.invoice_id} - ${date} [${
        trx.status || "Belum Lunas"
      }]`;
      excelRows.push([headerTitle]);
      excelRows.push([
        "Nama Barang",
        "Qty",
        "Satuan",
        "Harga Satuan",
        "Subtotal",
      ]);
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
      excelRows.push(["", "", "", "TOTAL TAGIHAN:", Number(trx.total_tagihan)]);
      excelRows.push([]);
      excelRows.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    worksheet["!cols"] = [
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Piutang");
    XLSX.writeFile(workbook, `Piutang_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex flex-wrap gap-2 items-center">
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[140px] text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="Lunas">✅ Lunas</option>
            <option value="Belum Lunas">⏳ Belum Lunas</option>
          </select>

          {/* LOGIC DROPDOWN OUTLET */}
          {isAdmin ? (
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[160px] text-slate-700"
            >
              <option value="all">🏢 Semua Outlet</option>
              {outletsList.map((out) => (
                <option key={out} value={out}>
                  {out}
                </option>
              ))}
            </select>
          ) : (
            // Tampilan Read-only untuk User
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 min-w-[160px] flex items-center gap-2 cursor-not-allowed">
              <span>🏢</span> {userOutlet}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Cari No Invoice / Barang..."
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
          📊 Excel
        </button>
        <button
          onClick={handlePrintPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50"
        >
          {isExporting ? "Memuat..." : "🖨️ Laporan PDF"}
        </button>
      </div>
    </div>
  );
}
