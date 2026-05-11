"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ProductCombobox from "@/components/form/ProductCombobox";
import QuickAddProductModal from "@/components/form/QuickAddProductModal";
import { submitBarangMasuk, checkInvoiceExists } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import {
  LayoutGrid,
  X,
  Search,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Store,
  Hash,
  Calendar,
  Save,
} from "lucide-react";

// --- TIPE DATA ---
interface Product {
  id: number;
  nama: string;
  kode_produk: string;
  unit: string;
  sisa_stok: number;
  harga_jual: number;
  harga_beli?: number;
}

interface CartItem extends Product {
  qty: number;
  harga_beli: number;
  subtotal: number;
}

interface Vendor {
  id: number;
  nama_vendor: string;
}

const STORAGE_KEY = "bm_draft_v1";

export default function BarangMasukForm({
  products,
  vendors,
}: {
  products: Product[];
  vendors: Vendor[];
}) {
  const { addToast } = useToast();

  // --- STATE UTAMA (ORIGINAL) ---
  const [selectedVendor, setSelectedVendor] = useState("");
  const [noNota, setNoNota] = useState("");
  const [tglNota, setTglNota] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tglJatuhTempo, setTglJatuhTempo] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- STATE UI & MODE (NEW) ---
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // --- STATE UI ASLI ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalInitialName, setModalInitialName] = useState("");

  const comboboxRef = useRef<{ focus: () => void }>(null);

  // Helper: Decimal & Math Clean
  const cleanNum = (num: number) => Math.round(num * 100) / 100;

  // 1. LOAD DRAFT (LOGIC ASLI)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.vendor) setSelectedVendor(parsed.vendor);
        if (parsed.noNota) setNoNota(parsed.noNota);
        if (parsed.tglNota) setTglNota(parsed.tglNota);
        if (parsed.tglJatuhTempo) setTglJatuhTempo(parsed.tglJatuhTempo);
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. AUTO-SAVE (LOGIC ASLI)
  useEffect(() => {
    if (!isLoaded) return;
    if (cart.length > 0 || selectedVendor || noNota) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cart,
          vendor: selectedVendor,
          noNota,
          tglNota,
          tglJatuhTempo,
        }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart, selectedVendor, noNota, tglNota, tglJatuhTempo, isLoaded]);

  // 3. VALIDASI INVOICE (LOGIC ASLI)
  useEffect(() => {
    const check = async () => {
      if (selectedVendor && noNota) {
        const res = await checkInvoiceExists(selectedVendor, noNota);
        if (res.exists) {
          setInvoiceError("⚠️ Nota ini sudah terdaftar!");
          addToast("Nota duplikat terdeteksi", "error");
        } else {
          setInvoiceError("");
        }
      }
    };
    const timeout = setTimeout(check, 800);
    return () => clearTimeout(timeout);
  }, [selectedVendor, noNota]);

  // --- HANDLER UPDATE KERANJANG ---
  const handleUpdateItem = (
    productId: number,
    field: "qty" | "harga_beli",
    value: string | number,
  ) => {
    let val =
      typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
    if (isNaN(val) || val < 0) val = 0;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === productId);
      const productRef = products.find((p) => p.id === productId);

      if (existingIdx >= 0) {
        const newCart = [...prev];
        const updatedItem = { ...newCart[existingIdx], [field]: val };
        updatedItem.subtotal = cleanNum(
          updatedItem.qty * updatedItem.harga_beli,
        );

        if (updatedItem.qty === 0)
          return prev.filter((item) => item.id !== productId);
        newCart[existingIdx] = updatedItem;
        return newCart;
      } else if (productRef) {
        const newItem: CartItem = {
          ...productRef,
          qty: field === "qty" ? val : 1,
          harga_beli: field === "harga_beli" ? val : productRef.harga_beli || 0,
          subtotal: 0,
        };
        newItem.subtotal = cleanNum(newItem.qty * newItem.harga_beli);
        return [...prev, newItem];
      }
      return prev;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setCart([]);
    setNoNota("");
    setSelectedVendor("");
    setTglJatuhTempo("");
    localStorage.removeItem(STORAGE_KEY);
    addToast("Formulir direset", "info");
  };

  const handleSubmit = async () => {
    if (!selectedVendor || !noNota || !tglJatuhTempo || cart.length === 0)
      return addToast("Lengkapi semua data!", "error");

    setIsSubmitting(true);
    const res = await submitBarangMasuk({
      vendor: selectedVendor,
      noNota,
      tanggalNota: tglNota,
      tanggalJatuhTempo: tglJatuhTempo,
      items: cart,
    });
    setIsSubmitting(false);

    if (res.error) addToast(`Gagal: ${res.error}`, "error");
    else {
      addToast("Berhasil! Barang Masuk tersimpan.", "success");
      handleReset();
    }
  };

  const grandTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Logic Filter Katalog
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        const n = p.nama || "";
        return (
          n.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedAlphabet
            ? n.toUpperCase().startsWith(selectedAlphabet)
            : true)
        );
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [searchQuery, selectedAlphabet, products]);

  if (!isLoaded) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
          Barang Masuk / Pembelian
        </h2>
        <button
          onClick={() => setIsQuickMode(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-indigo-100"
        >
          <LayoutGrid size={18} /> Mode Katalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: DATA NOTA */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest">
              <Store size={16} /> Data Vendor & Nota
            </h3>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase">
                Vendor
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">-- Pilih Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.nama_vendor}>
                    {v.nama_vendor}
                  </option>
                ))}
              </select>

              <label className="text-[10px] font-black text-slate-400 uppercase">
                No. Nota / Invoice
              </label>
              <input
                type="text"
                value={noNota}
                onChange={(e) => setNoNota(e.target.value)}
                className={`w-full p-3 border rounded-xl font-bold outline-none ${invoiceError ? "border-red-500" : ""}`}
                placeholder="Contoh: INV-001"
              />
              {invoiceError && (
                <p className="text-[10px] text-red-500 font-bold italic">
                  {invoiceError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Tgl Nota
                  </label>
                  <input
                    type="date"
                    value={tglNota}
                    onChange={(e) => setTglNota(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={tglJatuhTempo}
                    onChange={(e) => setTglJatuhTempo(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest">
              Cari Manual
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <ProductCombobox
                    ref={comboboxRef}
                    products={products}
                    onSelect={(p) => handleUpdateItem(p.id, "qty", 1)}
                  />
                </div>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TABLE KERANJANG UTAMA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
            <div className="p-6 border-b flex justify-between items-end bg-slate-50/50 rounded-t-2xl">
              <span className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                Rincian Barang ({cart.length})
              </span>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Total Pembelian
                </p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter tabular-nums">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left">Produk</th>
                    <th className="px-6 py-4 text-center w-32">Qty</th>
                    <th className="px-6 py-4 text-center w-40">
                      Harga Beli (@)
                    </th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                    <th className="px-6 py-4 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-indigo-50/20 transition-all"
                    >
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 uppercase text-xs truncate max-w-[200px]">
                          {item.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.kode_produk}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateItem(
                                item.id,
                                "qty",
                                cleanNum(item.qty - 1),
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-white transition-all"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            value={item.qty}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "qty", e.target.value)
                            }
                            className="w-16 text-center font-black text-slate-700 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none tabular-nums"
                          />
                          <button
                            onClick={() =>
                              handleUpdateItem(
                                item.id,
                                "qty",
                                cleanNum(item.qty + 1),
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-green-500 hover:bg-white transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={item.harga_beli}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "harga_beli",
                              e.target.value,
                            )
                          }
                          className="w-full text-center font-black text-slate-600 bg-slate-50 py-1 rounded-lg border border-transparent focus:border-indigo-500 outline-none tabular-nums"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
                className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs tracking-tighter"
              >
                {isSubmitting ? "Proses..." : "SIMPAN BARANG MASUK"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- KATALOG FULLSCREEN --- */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white shadow-xl">
            <button
              onClick={() => setIsQuickMode(false)}
              className="flex items-center gap-2 font-bold px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors tracking-tighter"
            >
              <ArrowLeft /> KEMBALI
            </button>
            <div className="text-center flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                Katalog Barang Masuk
              </p>
              <p className="font-black text-indigo-400 text-lg">
                Rp {grandTotal.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => setIsQuickMode(false)}
              className="bg-indigo-600 px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              SELESAI
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* AZ Sidebar */}
            <div className="w-16 bg-slate-50 border-r flex flex-col items-center py-4 gap-1 overflow-y-auto shrink-0 shadow-inner">
              <button
                onClick={() => setSelectedAlphabet("")}
                className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${
                  selectedAlphabet === ""
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-400"
                }`}
              >
                ALL
              </button>
              {alphabets.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedAlphabet(c)}
                  className={`w-11 h-11 rounded-xl text-xs font-bold transition-all ${
                    selectedAlphabet === c
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/30">
              <div className="p-4 bg-white shadow-sm flex gap-4">
                <input
                  type="text"
                  placeholder="Cari barang untuk dibeli..."
                  className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all uppercase placeholder:normal-case"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start pb-20">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((i) => i.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col justify-between h-[13rem] shadow-sm ${
                        inCart
                          ? "border-indigo-600 bg-white scale-[1.02]"
                          : "border-white bg-white hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <p className="font-black text-slate-800 uppercase text-[10px] leading-tight line-clamp-2 h-7 mb-1">
                          {p.nama}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Harga Terakhir
                        </p>
                        <p className="text-[11px] font-black text-indigo-500 tabular-nums">
                          Rp {p.harga_beli?.toLocaleString("id-ID") || "0"}
                        </p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {inCart ? (
                          <div className="space-y-2">
                            {/* Input Qty Desimal */}
                            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 justify-between border border-slate-100">
                              <button
                                onClick={() =>
                                  handleUpdateItem(
                                    p.id,
                                    "qty",
                                    cleanNum(inCart.qty - 1),
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-red-500 shadow-sm"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                step="0.1"
                                value={inCart.qty}
                                onChange={(e) =>
                                  handleUpdateItem(p.id, "qty", e.target.value)
                                }
                                className="w-12 text-center font-black text-xs bg-transparent outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateItem(
                                    p.id,
                                    "qty",
                                    cleanNum(inCart.qty + 1),
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-green-500 shadow-sm"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            {/* Input Harga Beli Dinamis */}
                            <div className="relative">
                              <input
                                type="number"
                                value={inCart.harga_beli}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    p.id,
                                    "harga_beli",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 bg-indigo-50 rounded-xl text-[10px] font-black text-center outline-none border border-indigo-100 focus:border-indigo-400 text-indigo-700"
                                placeholder="Set Harga"
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpdateItem(p.id, "qty", 1)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK BARU (ASLI) */}
      <QuickAddProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        initialName={modalInitialName}
        onSuccess={(newProduct) => {
          handleUpdateItem(newProduct.id, "qty", 1);
          addToast(`Produk "${newProduct.nama}" ditambahkan`, "success");
        }}
      />
    </div>
  );
}
