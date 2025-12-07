// components/piutang/PiutangList.tsx
"use client";

import { useState } from "react";
import {
  toggleStatusPiutang,
  deletePiutang,
} from "@/app/(dashboard)/piutang/actions";
import UploadModal from "./UploadModal";
import EditModal from "./EditModal";
import { generateInvoiceHTML } from "@/utils/pdfGenerator"; // Import generator invoice

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface Props {
  data: any[];
  userRole: string; // Params Baru
  settings?: any; // Params Baru
  products: any[];
}

export default function PiutangList({
  data,
  userRole,
  settings,
  products,
}: Props) {
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);

  const isAdmin = userRole === "admin"; // Cek hak akses

  // Group by Outlet
  const groupedData = data.reduce((acc: any, item) => {
    const outlet = item.outlet_name || "Tanpa Nama";
    if (!acc[outlet]) {
      acc[outlet] = {
        items: [],
        total: 0,
        totalLunas: 0,
        totalBelum: 0,
      };
    }
    acc[outlet].items.push(item);

    const amount = item.total_tagihan || 0;
    acc[outlet].total += amount;

    if ((item.status || "").toLowerCase() === "lunas") {
      acc[outlet].totalLunas += amount;
    } else {
      acc[outlet].totalBelum += amount;
    }

    return acc;
  }, {});

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    if (!isAdmin) return; // Guard extra
    setIsUpdating(id);
    const res = await toggleStatusPiutang(id, currentStatus);
    setIsUpdating(null);
    if (res.error) alert("Gagal: " + res.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data piutang ini?")) return;
    const res = await deletePiutang(id);
    if (res.error) alert("Gagal: " + res.error);
  };

  // LOGIC CETAK INVOICE
  const handlePrintInvoice = (item: any) => {
    const htmlContent = generateInvoiceHTML(item, settings);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Invoice #${item.invoice_id}</title></head>
          <body onload="window.print()">${htmlContent}</body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <UploadModal
        isOpen={!!uploadData}
        onClose={() => setUploadData(null)}
        transactionId={uploadData}
      />

      <EditModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        data={editData}
        products={products || []}
      />

      {Object.keys(groupedData).length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          Tidak ada data piutang sesuai filter.
        </div>
      ) : (
        Object.entries(groupedData).map(([outlet, group]: [string, any]) => (
          <div
            key={outlet}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up"
          >
            {/* HEADER OUTLET */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <span className="text-2xl">🏪</span> {outlet}
              </h3>

              <div className="flex flex-wrap gap-2 text-xs font-bold w-full md:w-auto">
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-200 text-center min-w-[100px]">
                  Lunas: {formatRupiah(group.totalLunas)}
                </div>
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 text-center min-w-[100px]">
                  Belum: {formatRupiah(group.totalBelum)}
                </div>
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-center min-w-[120px]">
                  Total: {formatRupiah(group.total)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-white border-b">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Bukti</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.items.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.invoice_id}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(item.tanggal_pengiriman)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {formatRupiah(item.total_tagihan)}
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="px-4 py-3 text-center">
                        {isAdmin ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(item.id, item.status)
                            }
                            disabled={isUpdating === item.id}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider transition-all ${
                              item.status?.toLowerCase() === "lunas"
                                ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            } ${
                              isUpdating === item.id
                                ? "opacity-50 cursor-wait"
                                : ""
                            }`}
                          >
                            {item.status || "Belum Lunas"}
                          </button>
                        ) : (
                          // Tampilan Badge Biasa untuk User
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              item.status?.toLowerCase() === "lunas"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            {item.status || "Belum Lunas"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.bukti_transfer ? (
                          <div className="flex flex-col items-center gap-1">
                            <a
                              href={item.bukti_transfer}
                              target="_blank"
                              className="text-indigo-600 hover:underline text-xs font-medium"
                            >
                              Lihat
                            </a>
                            <button
                              onClick={() => setUploadData(item.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600"
                            >
                              Ganti
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadData(item.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded hover:bg-slate-100"
                          >
                            Upload
                          </button>
                        )}
                      </td>

                      {/* AKSI COLUMN */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {/* Tombol Invoice (Untuk Semua) */}
                          <button
                            onClick={() => handlePrintInvoice(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Cetak Invoice"
                          >
                            🖨️
                          </button>

                          {/* Tombol Edit & Delete (Hanya Admin) */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditData(item)}
                                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Edit Data"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Hapus Data"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
