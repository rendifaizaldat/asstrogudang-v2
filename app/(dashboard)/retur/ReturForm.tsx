// app/(dashboard)/retur/ReturForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ProductCombobox from "@/components/form/ProductCombobox";
import { submitRetur } from "./actions";

interface Product {
  id: number;
  nama: string;
  kode_produk: string;
  unit: string;
  sisa_stok: number;
  harga_jual: number;
}

interface CartItem extends Product {
  qty: number;
  subtotal: number;
}

const STORAGE_KEY = "retur_draft_v1";

export default function ReturForm({
  products,
  outlets,
  userRole,
}: {
  products: Product[];
  outlets: string[];
  userRole: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempQty, setTempQty] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const comboboxRef = useRef<{ focus: () => void }>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // 1. LOAD DRAFT
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.outlet) setSelectedOutlet(parsed.outlet);
        if (parsed.date) setDate(parsed.date);
        if (parsed.catatan) setCatatan(parsed.catatan);
      } catch (e) {
        console.error("Gagal load draft Retur", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. AUTO-SAVE
  useEffect(() => {
    if (!isLoaded) return;
    if (cart.length > 0 || selectedOutlet !== "" || catatan !== "") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cart, outlet: selectedOutlet, date, catatan })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart, selectedOutlet, date, catatan, isLoaded]);

  // SHORTCUT Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        comboboxRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setTempQty(1);
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (tempQty <= 0) return alert("Jumlah harus lebih dari 0");

    // Validasi stok tidak wajib ketat untuk retur (bisa jadi barang rusak fisik yg belum masuk sistem),
    // tapi sebagai pengaman kita peringatkan saja.
    if (tempQty > selectedProduct.sisa_stok) {
      if (
        !confirm(
          `Peringatan: Jumlah retur (${tempQty}) melebihi sisa stok sistem (${selectedProduct.sisa_stok}). Lanjutkan?`
        )
      )
        return;
    }

    const existingIdx = cart.findIndex(
      (item) => item.id === selectedProduct.id
    );
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].qty += tempQty;
      newCart[existingIdx].subtotal =
        newCart[existingIdx].qty * newCart[existingIdx].harga_jual;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          ...selectedProduct,
          qty: tempQty,
          subtotal: tempQty * selectedProduct.harga_jual,
        },
      ]);
    }

    setSelectedProduct(null);
    setTempQty(1);
    comboboxRef.current?.focus();
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addToCart();
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleReset = () => {
    if (
      confirm("Reset formulir retur? Data yang belum disimpan akan hilang.")
    ) {
      setCart([]);
      if (userRole === "admin") setSelectedOutlet("");
      setCatatan("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return alert("Daftar barang retur masih kosong!");
    if (userRole === "admin" && !selectedOutlet)
      return alert("Pilih outlet asal!");
    if (!date) return alert("Pilih tanggal retur!");

    if (!confirm("Simpan Data Retur ini? Stok akan otomatis bertambah."))
      return;

    setIsSubmitting(true);

    const result = await submitRetur({
      outlet: selectedOutlet,
      tanggal: date,
      catatan: catatan,
      items: cart,
    });

    setIsSubmitting(false);

    if (result.error) {
      alert(`Gagal: ${result.error}`);
    } else {
      alert("Berhasil! Retur telah diproses.");
      setCart([]);
      setCatatan("");
      if (userRole === "admin") setSelectedOutlet("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  if (!isLoaded)
    return (
      <div className="p-10 text-center text-slate-500">Memuat data...</div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* FORM INPUT */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🔙</span> Info Pengembalian
          </h3>

          <div className="space-y-4">
            {userRole === "admin" && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Outlet Asal
                </label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                >
                  <option value="">-- Pilih Outlet --</option>
                  {outlets.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Tanggal Retur
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Catatan / Alasan
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Contoh: Barang rusak saat pengiriman..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-bl-full -mr-4 -mt-4"></div>

          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
            <span className="text-xl">📦</span> Pilih Barang
          </h3>

          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Cari Produk
              </label>
              <ProductCombobox
                ref={comboboxRef}
                products={products}
                onSelect={handleProductSelect}
                disabled={isSubmitting}
              />
            </div>

            {selectedProduct && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 animate-fade-in">
                <strong>{selectedProduct.nama}</strong>
                <div className="flex justify-between mt-1">
                  <span>
                    Harga:{" "}
                    {new Intl.NumberFormat("id-ID").format(
                      selectedProduct.harga_jual
                    )}
                  </span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded border">
                    Stok: {selectedProduct.sisa_stok}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Jumlah Retur
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => setTempQty(Number(e.target.value))}
                  onKeyDown={handleQtyKeyDown}
                  disabled={!selectedProduct}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                />
              </div>
              <button
                onClick={addToCart}
                disabled={!selectedProduct || isSubmitting}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Input
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW TABEL */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Daftar Barang Retur</h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              {cart.length} Item
            </span>
          </div>

          <div className="flex-1 overflow-auto p-0 min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Nama Barang</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Harga</th>
                  <th className="px-6 py-3 text-right">Nilai</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      Belum ada barang retur.
                      <br />
                      <span className="text-xs opacity-70">
                        Gunakan Ctrl+K untuk input cepat
                      </span>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-red-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.nama}
                        <div className="text-xs text-slate-400">
                          {item.kode_produk}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                          {item.qty} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                        {new Intl.NumberFormat("id-ID").format(item.harga_jual)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-500">
                        {new Intl.NumberFormat("id-ID").format(item.subtotal)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Total Nilai Retur</span>
              <span className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(grandTotal)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={cart.length === 0}
                className="px-6 py-4 rounded-xl font-bold border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Reset
              </button>

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:shadow-none flex justify-center gap-2"
              >
                {isSubmitting ? "Memproses..." : "✅ Proses Retur"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
