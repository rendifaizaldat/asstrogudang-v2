// components/produk/ProductList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, updateStock } from "@/app/(dashboard)/produk/actions";
import ProductModal from "./ProductModal";
import StockHistoryModal from "./StockHistoryModal";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID").format(num);

export default function ProductList({ products, search }: any) {
  const router = useRouter();

  // Modals State
  const [editData, setEditData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isUpdatingStok, setIsUpdatingStok] = useState<number | null>(null);

  // Edit Stok Inline
  const handleStockChange = async (
    id: number,
    currentStok: number,
    event: any
  ) => {
    const newVal = prompt(
      "Masukkan jumlah stok baru (Opname Manual):",
      String(currentStok)
    );
    if (newVal === null) return;

    const numVal = parseInt(newVal);
    if (isNaN(numVal) || numVal < 0) return alert("Stok tidak valid");

    if (numVal !== currentStok) {
      setIsUpdatingStok(id);
      const res = await updateStock(id, numVal);
      setIsUpdatingStok(null);
      if (res.error) alert(res.error);
      else router.refresh();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus produk "${name}"?`)) return;
    const res = await deleteProduct(id);
    if (res.error) alert(res.error);
  };

  return (
    <>
      <ProductModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        product={editData}
      />
      <StockHistoryModal
        isOpen={!!historyData}
        onClose={() => setHistoryData(null)}
        product={historyData}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4 text-center">Unit</th>
                <th className="px-6 py-4 text-right">Harga Beli</th>
                <th className="px-6 py-4 text-right">Harga Jual</th>
                <th className="px-6 py-4 text-center w-32">Stok</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.length === 0 ? (
                <tr>
                  <td
                    colspan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Produk tidak ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{p.nama}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {p.kode_produk}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-600">
                        {p.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {formatRupiah(p.harga_beli)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      {formatRupiah(p.harga_jual)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) =>
                            handleStockChange(p.id, p.sisa_stok, e)
                          }
                          disabled={isUpdatingStok === p.id}
                          className={`font-bold px-3 py-1 rounded-lg border transition-all ${
                            p.sisa_stok <= 0
                              ? "bg-red-50 text-red-600 border-red-200"
                              : p.sisa_stok <= 5
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : "bg-green-50 text-green-600 border-green-200"
                          } hover:shadow-sm active:scale-95`}
                          title="Klik untuk edit stok manual (Opname)"
                        >
                          {isUpdatingStok === p.id ? "..." : p.sisa_stok}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setHistoryData(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Riwayat Stok"
                        >
                          🕒
                        </button>
                        <button
                          onClick={() => setEditData(p)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nama)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
