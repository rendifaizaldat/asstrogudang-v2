// app/(dashboard)/purchase-order/PurchaseOrderForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPurchaseOrder } from "@/app/(dashboard)/purchase-order/actions";
import {
  Trash2,
  Plus,
  Save,
  ShoppingCart as ShoppingCartIcon,
} from "lucide-react";
import ProductCombobox from "@/components/form/ProductCombobox";
import { useToast } from "@/components/ui/ToastProvider"; // 1. Import Toast

const STORAGE_KEY = "asstro_po_draft";

export default function PurchaseOrderForm({
  products,
  outlets,
  userRole,
  userOutlet,
}: {
  products: any[];
  outlets: string[];
  userRole: string;
  userOutlet?: string;
}) {
  const { addToast } = useToast(); // 2. Init Toast

  // State Utama
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tanggalKirim, setTanggalKirim] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Input Produk
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const qtyInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<{ focus: () => void }>(null);

  // 1. Load Draft
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        setCart(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Gagal load draft", e);
      }
    }

    if (userRole === "admin") {
      if (!localStorage.getItem("po_last_outlet")) setSelectedOutlet("");
    } else {
      setSelectedOutlet(userOutlet || "");
    }
  }, [userRole, userOutlet]);

  // 2. Auto Save Draft
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  // Handler Select Product
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Handler Add Item (Updated with Toast)
  const handleAddItem = () => {
    if (!selectedProduct) return addToast("Pilih produk dulu!", "error");
    if (qty <= 0) return addToast("Jumlah minimal 1", "error");

    // Validasi Stok
    if (qty > selectedProduct.sisa_stok) {
      addToast(
        `Stok kurang! Sisa: ${selectedProduct.sisa_stok} ${selectedProduct.unit}`,
        "error"
      );
      return;
    }

    const existingIdx = cart.findIndex(
      (item) => item.product_id === selectedProduct.id
    );

    if (existingIdx >= 0) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].qty + qty;

      if (newQty > selectedProduct.sisa_stok) {
        addToast("Total jumlah melebihi sisa stok saat ini!", "error");
        return;
      }
      updatedCart[existingIdx].qty = newQty;
      updatedCart[existingIdx].subtotal = newQty * selectedProduct.harga_jual;
      setCart(updatedCart);
      addToast(`Qty ${selectedProduct.nama} diperbarui`, "info");
    } else {
      setCart([
        ...cart,
        {
          product_id: selectedProduct.id,
          nama: selectedProduct.nama,
          kode: selectedProduct.kode_produk,
          unit: selectedProduct.unit,
          qty: qty,
          harga_jual: selectedProduct.harga_jual,
          subtotal: qty * selectedProduct.harga_jual,
        },
      ]);
      addToast("Produk ditambahkan", "success");
    }

    setQty(1);
    setSelectedProduct(null);
    setTimeout(() => {
      comboboxRef.current?.focus();
    }, 50);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
    addToast("Item dihapus", "info");
  };

  // Handler Reset (Tanpa Confirm, pakai Toast Info)
  const handleReset = () => {
    setCart([]);
    if (userRole === "admin") setSelectedOutlet("");
    localStorage.removeItem(STORAGE_KEY);
    addToast("Formulir berhasil direset", "info");
  };

  // Handler Submit (Tanpa Confirm, Validasi Pakai Toast)
  const handleSubmit = async () => {
    if (!selectedOutlet) return addToast("Pilih Outlet tujuan!", "error");
    if (cart.length === 0) return addToast("Keranjang masih kosong!", "error");
    if (!tanggalKirim) return addToast("Tentukan tanggal kirim!", "error");

    setLoading(true);

    const payload = {
      outlet: selectedOutlet,
      tanggalKirim,
      items: cart.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        harga_jual: item.harga_jual,
      })),
    };

    const result = await createPurchaseOrder(payload);

    setLoading(false);

    if (result.error) {
      addToast(`Gagal: ${result.error}`, "error");
    } else {
      addToast("Berhasil! PO telah disimpan.", "success");
      setCart([]);
      if (userRole === "admin") {
        setSelectedOutlet("");
      }
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const totalEstimasi = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* BAGIAN KIRI: INPUT FORM */}
      <div className="lg:col-span-1 space-y-6">
        {/* PANEL 1: DETAIL PENGIRIMAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            📝 Detail Pesanan
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Outlet Tujuan
              </label>
              {userRole === "admin" ? (
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Pilih Outlet --</option>
                  {outlets.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={userOutlet}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 cursor-not-allowed font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Rencana Kirim
              </label>
              <input
                type="date"
                value={tanggalKirim}
                onChange={(e) => setTanggalKirim(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* PANEL 2: INPUT PRODUK */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative z-50">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            📦 Tambah Barang
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Cari Produk{" "}
                {selectedProduct ? `(Dipilih: ${selectedProduct.nama})` : ""}
              </label>
              <ProductCombobox
                ref={comboboxRef}
                products={products}
                onSelect={handleProductSelect}
                placeholder="Ketik nama produk... (Enter)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Jumlah
              </label>
              <div className="flex gap-2">
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  onKeyDown={handleQtyKeyDown}
                  className="flex-1 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleAddItem}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
                  title="Tambah (Enter)"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN: TABEL KERANJANG */}
      <div className="lg:col-span-2 flex flex-col h-full z-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="font-bold text-lg text-slate-800">
              Keranjang ({cart.length} item)
            </h3>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Total:{" "}
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(totalEstimasi)}
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <ShoppingCartIcon size={48} className="mb-2 opacity-20" />
                <p>Belum ada barang dipilih.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Produk</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-center rounded-r-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-700">
                          {item.nama}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.kode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-white border border-slate-200 px-2 py-1 rounded font-bold text-slate-600">
                          {item.qty} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {new Intl.NumberFormat("id-ID").format(item.harga_jual)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600">
                        {new Intl.NumberFormat("id-ID").format(item.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={cart.length === 0}
              className="px-6 py-3 rounded-xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || cart.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1 active:scale-95"
            >
              {loading ? (
                "Memproses..."
              ) : (
                <>
                  <Save size={20} />
                  Simpan Pesanan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
