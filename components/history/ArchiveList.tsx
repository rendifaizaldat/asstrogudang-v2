// components/history/ArchiveList.tsx
"use client";

import { useState } from "react";
import { restoreTransaction } from "@/app/(dashboard)/history/actions";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ArchiveList({
  payables,
  receivables,
}: {
  payables: any[];
  receivables: any[];
}) {
  const [activeTab, setActiveTab] = useState<"hutang" | "piutang">("hutang");
  const [isRestoring, setIsRestoring] = useState<number | null>(null);

  const handleRestore = async (id: number, type: "hutang" | "piutang") => {
    if (!confirm("Pulihkan data ini? Data akan kembali muncul di menu aktif."))
      return;

    setIsRestoring(id);
    const res = await restoreTransaction(id, type);
    setIsRestoring(null);

    if (res.error) alert(res.error);
    else alert("Berhasil dipulihkan!");
  };

  const EmptyState = () => (
    <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
      <p className="text-slate-400">Tidak ada data arsip di sini.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
      {/* TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("hutang")}
          className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "hutang"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          🚛 Hutang Vendor ({payables.length})
        </button>
        <button
          onClick={() => setActiveTab("piutang")}
          className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "piutang"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          🏪 Piutang Outlet ({receivables.length})
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6 flex-1 overflow-auto">
        {activeTab === "hutang" ? (
          payables.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Tanggal</th>
                    <th className="px-4 py-3">No. Nota</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center rounded-r-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payables.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(item.tanggal_nota)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {item.no_nota_vendor}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {item.nama_vendor}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatRupiah(item.total_tagihan)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRestore(item.id, "hutang")}
                          disabled={isRestoring === item.id}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all flex items-center gap-1 mx-auto"
                        >
                          {isRestoring === item.id ? "..." : "♻️ Pulihkan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : receivables.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Tanggal</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(item.tanggal_pengiriman)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {item.invoice_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.outlet_name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatRupiah(item.total_tagihan)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRestore(item.id, "piutang")}
                        disabled={isRestoring === item.id}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all flex items-center gap-1 mx-auto"
                      >
                        {isRestoring === item.id ? "..." : "♻️ Pulihkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
