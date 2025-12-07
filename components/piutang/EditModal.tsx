"use client";

import { useState, useEffect, useRef } from "react";
import {
  updatePiutang,
  getPiutangDetail,
} from "@/app/(dashboard)/piutang/actions";
import { Trash2, Plus } from "lucide-react";
import ProductCombobox from "@/components/form/ProductCombobox"; // Import komponen yang sudah ada

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);

export default function EditModal({ isOpen, onClose, data, products }: any) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form State Utama
  const [invoiceId, setInvoiceId] = useState("");
  const [outletName, setOutletName] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // State untuk Tambah Item
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addQty, setAddQty] = useState(1);

  // REFS untuk Manajemen Fokus (Keyboard Navigation)
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<{ focus: () => void }>(null);

  // 1. FETCH DETAIL
  useEffect(() => {
    const fetchDetail = async () => {
      if (isOpen && data?.id) {
        setFetching(true);
        const res = await getPiutangDetail(data.id);
        setFetching(false);

        if (res.data) {
          const detail = res.data;
          setInvoiceId(detail.invoice_id || "");
          setOutletName(detail.outlet_name || "");
          setDate(
            detail.tanggal_pengiriman
              ? detail.tanggal_pengiriman.split("T")[0]
              : ""
          );

          if (detail.transaction_items) {
            setItems(
              detail.transaction_items.map((i: any) => ({
                product_id: i.product_id,
                nama: i.products?.nama || "Item Terhapus",
                unit: i.products?.unit,
                qty: Number(i.quantity || 0),
                harga: Number(i.price_per_unit || 0),
                subtotal: Number(i.subtotal || 0),
              }))
            );
          } else {
            setItems([]);
          }
        }

        // Reset state tambah item
        setSelectedProduct(null);
        setAddQty(1);

        // Fokus ke invoice ID dulu saat buka modal
        // (Opsional, atau bisa langsung ke combobox jika mau cepat)
      }
    };
    fetchDetail();
  }, [isOpen, data]);

  // 2. HANDLER SAAT PRODUK DIPILIH (Enter di Combobox)
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setAddQty(1);

    // UX: Pindah fokus ke Qty Input agar user bisa langsung ketik jumlah
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  // 3. HANDLER SAAT TEKAN ENTER DI QTY
  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  // 4. LOGIC MENAMBAH ITEM KE TABEL
  const handleAddItem = () => {
    if (!selectedProduct) return alert("Pilih produk terlebih dahulu!");
    if (addQty <= 0) return alert("Jumlah minimal 1");

    // Cek Duplikat: Jika ada, update qty. Jika belum, tambah baru.
    const existingIndex = items.findIndex(
      (i) => i.product_id === selectedProduct.id
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].qty += addQty;
      newItems[existingIndex].subtotal =
        newItems[existingIndex].qty * newItems[existingIndex].harga;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: selectedProduct.id,
          nama: selectedProduct.nama,
          unit: selectedProduct.unit,
          qty: addQty,
          harga: selectedProduct.harga_jual,
          subtotal: addQty * selectedProduct.harga_jual,
        },
      ]);
    }

    // UX: Reset dan Kembalikan Fokus ke Combobox (Rapid Entry)
    setSelectedProduct(null);
    setAddQty(1);

    // Kembalikan fokus ke pencarian agar bisa input barang selanjutnya
    setTimeout(() => {
      comboboxRef.current?.focus();
    }, 50);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: "qty" | "harga",
    value: number
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].subtotal = newItems[index].qty * newItems[index].harga;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Simpan perubahan transaksi ini?")) return;

    setLoading(true);

    const headerData = { name: outletName, invoiceId, date };
    const itemData = items.map((i) => ({
      product_id: i.product_id,
      quantity: Number(i.qty),
      price_per_unit: Number(i.harga),
    }));

    const res = await updatePiutang(data.id, headerData, itemData);

    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert("Berhasil diperbarui!");
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
          <h3 className="font-bold text-xl text-slate-800">Edit Transaksi</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {fetching ? (
          <div className="p-20 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. INFORMASI HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Outlet
                </label>
                <input
                  value={outletName}
                  disabled
                  className="w-full bg-slate-200 border border-slate-300 p-2 rounded-lg text-slate-500 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  No. Invoice
                </label>
                <input
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 2. FORM TAMBAH ITEM (MENGGUNAKAN EXISTING COMBOBOX) */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row gap-3 items-start relative z-50">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                  Cari & Tambah Produk{" "}
                  {selectedProduct ? `(Dipilih: ${selectedProduct.nama})` : ""}
                </label>

                {/* IMPLEMENTASI COMBOBOX YG SUDAH ADA */}
                <ProductCombobox
                  ref={comboboxRef} // Ref untuk auto-focus balik
                  products={products}
                  onSelect={handleProductSelect}
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                  Qty
                </label>
                <input
                  ref={qtyInputRef} // Ref untuk auto-focus masuk
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  onKeyDown={handleQtyKeyDown} // Enter handler
                  className="w-full border border-indigo-200 rounded-lg p-2.5 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-6"
                title="Tambah (Enter)"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* 3. TABEL ITEMS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm relative z-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Nama Produk</th>
                    <th className="px-4 py-3 text-center w-24">Qty</th>
                    <th className="px-4 py-3 text-right w-32">Harga</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-center w-12">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-slate-400"
                      >
                        Belum ada item.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-2 font-medium text-slate-700">
                          {item.nama}
                          <div className="text-[10px] text-slate-400">
                            {item.unit}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.qty}
                            min="0"
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "qty",
                                Number(e.target.value)
                              )
                            }
                            className="w-full border border-slate-200 rounded p-1 text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.harga}
                            min="0"
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "harga",
                                Number(e.target.value)
                              )
                            }
                            className="w-full border border-slate-200 rounded p-1 text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800">
                          {formatRupiah(item.subtotal)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER TOTAL & BUTTONS */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-2xl">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold">
              Total Tagihan
            </span>
            <div className="text-2xl font-bold text-indigo-600">
              {formatRupiah(totalTagihan)}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
