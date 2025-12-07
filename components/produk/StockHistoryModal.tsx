// components/produk/StockHistoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import { getStockHistory } from "@/app/(dashboard)/produk/actions";

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function StockHistoryModal({ isOpen, onClose, product }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?.id) {
      setLoading(true);
      getStockHistory(product.id).then((res) => {
        setLoading(false);
        if (res.data) setHistory(res.data);
        else setHistory([]);
      });
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Riwayat Stok</h3>
            <p className="text-xs text-slate-500">
              {product?.nama} ({product?.kode_produk})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-400">
              Memuat riwayat...
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              Belum ada riwayat pergerakan stok.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-white sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3 text-right">Perubahan</th>
                  <th className="px-6 py-3 text-right">Akhir</th>
                  <th className="px-6 py-3">Ket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((item, idx) => {
                  const isPositive = Number(item.change_amount) > 0;
                  const typeLabel =
                    item.type === "barang_masuk"
                      ? "Masuk"
                      : item.type === "penjualan"
                      ? "Keluar"
                      : item.type === "retur"
                      ? "Retur"
                      : "Edit";

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`text-[10px] px-2 py-1 rounded border font-medium ${
                            item.type === "barang_masuk"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : item.type === "penjualan"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : item.type === "retur"
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-bold ${
                          isPositive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {item.change_amount}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">
                        {item.stock_after}
                      </td>
                      <td
                        className="px-6 py-3 text-xs text-slate-400 truncate max-w-[150px]"
                        title={item.reference}
                      >
                        {item.reference || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
