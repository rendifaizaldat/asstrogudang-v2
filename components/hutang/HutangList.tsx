// components/hutang/HutangList.tsx
"use client";

import { useState } from "react";
import {
  toggleStatusHutang,
  deleteHutang,
} from "@/app/(dashboard)/hutang/actions";
import UploadHutangModal from "./UploadHutangModal";
import EditHutangModal from "./EditHutangModal";

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

export default function HutangList({ data }: { data: any[] }) {
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);

  // 1. GROUPING BY VENDOR DENGAN KALKULASI DETAIL
  const groupedData = data.reduce((acc: any, item) => {
    const vendor = item.nama_vendor || "Tanpa Nama";

    if (!acc[vendor]) {
      acc[vendor] = {
        items: [],
        total: 0,
        totalLunas: 0,
        totalBelum: 0,
      };
    }

    acc[vendor].items.push(item);

    const amount = item.total_tagihan || 0;
    acc[vendor].total += amount;

    // Hitung Lunas vs Belum Lunas
    if ((item.status || "").toLowerCase() === "lunas") {
      acc[vendor].totalLunas += amount;
    } else {
      acc[vendor].totalBelum += amount;
    }

    return acc;
  }, {});

  // ACTIONS
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    setIsUpdating(id);
    const res = await toggleStatusHutang(id, currentStatus);
    setIsUpdating(null);
    if (res.error) alert("Gagal: " + res.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data hutang ini?")) return;
    const res = await deleteHutang(id);
    if (res.error) alert("Gagal: " + res.error);
  };

  return (
    <div className="space-y-6">
      {/* MODALS */}
      <UploadHutangModal
        isOpen={!!uploadData}
        onClose={() => setUploadData(null)}
        transactionId={uploadData}
      />

      <EditHutangModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        data={editData}
      />

      {Object.keys(groupedData).length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          Tidak ada data hutang vendor sesuai filter.
        </div>
      ) : (
        Object.entries(groupedData).map(([vendor, group]: [string, any]) => (
          <div
            key={vendor}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up"
          >
            {/* HEADER VENDOR DENGAN STATISTIK */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <span className="text-2xl">🚛</span> {vendor}
              </h3>

              <div className="flex flex-wrap gap-2 text-xs font-bold w-full md:w-auto">
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-200 text-center">
                  Lunas: {formatRupiah(group.totalLunas)}
                </div>
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 text-center">
                  Belum: {formatRupiah(group.totalBelum)}
                </div>
                <div className="flex-1 md:flex-none px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-center">
                  Total: {formatRupiah(group.total)}
                </div>
              </div>
            </div>

            {/* TABEL DATA */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-white border-b">
                  <tr>
                    <th className="px-4 py-3">No. Nota</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
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
                        {item.no_nota_vendor}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(item.tanggal_nota)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {formatRupiah(item.total_tagihan)}
                      </td>
                      <td className="px-4 py-3 text-center">
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
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
