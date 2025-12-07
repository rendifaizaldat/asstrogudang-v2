// components/hutang/EditHutangModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  updateHutang,
  getHutangDetail,
} from "@/app/(dashboard)/hutang/actions";

// Helper formatter
const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0); // Tambahkan fallback || 0

export default function EditHutangModal({ isOpen, onClose, data }: any) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form State
  const [noNota, setNoNota] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // Saat modal dibuka, fetch detail transaksi
  useEffect(() => {
    const fetchDetail = async () => {
      if (isOpen && data?.id) {
        setFetching(true);
        const res = await getHutangDetail(data.id);
        setFetching(false);

        if (res.data) {
          const detail = res.data;
          setNoNota(detail.no_nota_vendor || "");
          setVendorName(detail.nama_vendor || "");
          setDate(detail.tanggal_nota ? detail.tanggal_nota.split("T")[0] : "");

          if (detail.transaction_items) {
            setItems(
              detail.transaction_items.map((i: any) => {
                // FIX: Gunakan price_per_unit, fallback ke 0 jika kosong
                const harga = Number(i.price_per_unit || i.harga_beli || 0);
                const qty = Number(i.quantity || 0);

                return {
                  product_id: i.product_id,
                  nama: i.products?.nama || "Item Terhapus",
                  unit: i.products?.unit,
                  qty: qty,
                  harga: harga,
                  subtotal: qty * harga,
                };
              })
            );
          } else {
            setItems([]);
          }
        } else {
          alert("Gagal mengambil detail transaksi.");
          onClose();
        }
      }
    };

    fetchDetail();
  }, [isOpen, data]);

  // Handle Perubahan Qty/Harga
  const handleItemChange = (
    index: number,
    field: "qty" | "harga",
    value: number
  ) => {
    const newItems = [...items];
    // Pastikan value tidak NaN
    const safeValue = isNaN(value) ? 0 : value;

    newItems[index][field] = safeValue;
    newItems[index].subtotal = newItems[index].qty * newItems[index].harga;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Simpan perubahan? Stok akan disesuaikan.")) return;

    setLoading(true);

    const headerData = {
      name: vendorName,
      noNota: noNota,
      date: date,
    };

    const itemData = items.map((i) => ({
      product_id: i.product_id,
      quantity: Number(i.qty),
      price_per_unit: Number(i.harga),
    }));

    const res = await updateHutang(data.id, headerData, itemData);

    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert("Update berhasil!");
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalTagihan = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
        {/* HEADER MODAL */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h3 className="font-bold text-xl text-slate-800">
            Edit Hutang Vendor
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {fetching ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Memuat detail...
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="editHutangForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* INFO HEADER */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Vendor
                    </label>
                    <input
                      value={vendorName}
                      disabled
                      className="w-full bg-slate-200 border border-slate-300 p-2 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      No. Nota
                    </label>
                    <input
                      value={noNota}
                      onChange={(e) => setNoNota(e.target.value)}
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* TABEL ITEMS */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Produk</th>
                        <th className="px-4 py-3 text-center w-24">Qty</th>
                        <th className="px-4 py-3 text-right w-32">
                          Harga Beli
                        </th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {item.nama}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "qty",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={item.harga}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "harga",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </form>
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-2xl">
              <div>
                <span className="text-slate-500 text-sm block">
                  Total Tagihan
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatRupiah(totalTagihan)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="editHutangForm"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
