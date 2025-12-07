// app/(dashboard)/barang-masuk/BarangMasukForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ProductCombobox from "@/components/form/ProductCombobox";
import QuickAddProductModal from "@/components/form/QuickAddProductModal";
import { submitBarangMasuk, checkInvoiceExists } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";

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

  // --- STATE HEADER ---
  const [selectedVendor, setSelectedVendor] = useState("");
  const [noNota, setNoNota] = useState("");
  const [tglNota, setTglNota] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tglJatuhTempo, setTglJatuhTempo] = useState("");

  // --- STATE KERANJANG ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tempQty, setTempQty] = useState<number>(1);
  const [tempHargaBeli, setTempHargaBeli] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- STATE UI & VALIDASI ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [modalInitialName, setModalInitialName] = useState("");

  const comboboxRef = useRef<{ focus: () => void }>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const hargaInputRef = useRef<HTMLInputElement>(null);

  // 1. LOAD DRAFT
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

        if (parsed.cart && parsed.cart.length > 0) {
          addToast("Draft barang masuk dimuat kembali", "info");
        }
      } catch (e) {
        console.error("Gagal load draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. AUTO-SAVE
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
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart, selectedVendor, noNota, tglNota, tglJatuhTempo, isLoaded]);

  // 3. VALIDASI INVOICE
  useEffect(() => {
    const check = async () => {
      if (selectedVendor && noNota) {
        const res = await checkInvoiceExists(selectedVendor, noNota);
        if (res.exists) {
          setInvoiceError("⚠️ Nota ini sudah terdaftar!");
          addToast("Nota ini terdeteksi duplikat di database", "error");
        } else {
          setInvoiceError("");
        }
      } else {
        setInvoiceError("");
      }
    };
    const timeout = setTimeout(check, 800);
    return () => clearTimeout(timeout);
  }, [selectedVendor, noNota]);

  // SHORTCUT Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        comboboxRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // --- LOGIC ITEM ---
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setTempQty(1);
    setTempHargaBeli(product.harga_beli || 0);

    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  const addToCart = () => {
    if (!selectedProduct)
      return addToast("Pilih produk terlebih dahulu!", "error");
    if (tempQty <= 0) return addToast("Qty wajib diisi (minimal 1)", "error");
    if (tempHargaBeli <= 0) return addToast("Harga beli wajib diisi", "error");

    const newItem: CartItem = {
      ...selectedProduct,
      qty: tempQty,
      harga_beli: tempHargaBeli,
      subtotal: tempQty * tempHargaBeli,
    };

    const existingIdx = cart.findIndex((x) => x.id === selectedProduct.id);
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].qty += tempQty;
      newCart[existingIdx].harga_beli = tempHargaBeli;
      newCart[existingIdx].subtotal = newCart[existingIdx].qty * tempHargaBeli;
      setCart(newCart);
      addToast(`Update qty: ${selectedProduct.nama}`, "info");
    } else {
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setTempQty(1);
    setTempHargaBeli(0);
    comboboxRef.current?.focus();
  };

  const handleQtyEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      hargaInputRef.current?.focus();
      hargaInputRef.current?.select();
    }
  };

  const handleHargaEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addToCart();
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    // Menghapus confirm() di sini agar reset langsung terjadi
    setCart([]);
    setNoNota("");
    setSelectedVendor("");
    setTglJatuhTempo("");
    localStorage.removeItem(STORAGE_KEY);
    addToast("Formulir berhasil direset", "info");
  };

  const handleSubmit = async () => {
    if (!selectedVendor) return addToast("Pilih Vendor!", "error");
    if (!noNota) return addToast("Isi Nomor Nota!", "error");
    if (invoiceError) return addToast("Nomor Nota duplikat!", "error");
    if (!tglJatuhTempo) return addToast("Isi Tanggal Jatuh Tempo!", "error");
    if (cart.length === 0)
      return addToast("Belum ada barang di daftar!", "error");

    // === HAPUS CONFIRM DISINI ===
    // Langsung proses submit tanpa popup "Yes/No"

    setIsSubmitting(true);

    const res = await submitBarangMasuk({
      vendor: selectedVendor,
      noNota,
      tanggalNota: tglNota,
      tanggalJatuhTempo: tglJatuhTempo,
      items: cart,
    });

    setIsSubmitting(false);

    if (res.error) {
      addToast(`Gagal: ${res.error}`, "error");
    } else {
      addToast("Berhasil! Barang Masuk tersimpan.", "success");
      setCart([]);
      setNoNota("");
      setSelectedVendor("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const grandTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  if (!isLoaded) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {/* Card 1: Header Nota */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">🧾</span> Data Nota
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Vendor
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Pilih Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.nama_vendor}>
                  {v.nama_vendor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              No. Nota / Invoice
            </label>
            <input
              type="text"
              value={noNota}
              onChange={(e) => setNoNota(e.target.value)}
              placeholder="Contoh: INV-001/X/2025"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-800 focus:ring-2 outline-none ${
                invoiceError
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-200 focus:ring-primary"
              }`}
            />
            {invoiceError && (
              <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">
                {invoiceError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Tgl Nota
              </label>
              <input
                type="date"
                value={tglNota}
                onChange={(e) => setTglNota(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Jatuh Tempo
              </label>
              <input
                type="date"
                value={tglJatuhTempo}
                onChange={(e) => setTglJatuhTempo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Input Barang */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-3xl"></div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-xl">📥</span> Input Barang
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Cari Produk
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ProductCombobox
                    ref={comboboxRef}
                    products={products}
                    onSelect={handleProductSelect}
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  onClick={() => {
                    setModalInitialName("");
                    setShowProductModal(true);
                  }}
                  className="px-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shadow-sm font-bold text-lg"
                  title="Produk tidak ada? Tambah Baru"
                >
                  +
                </button>
              </div>
            </div>

            {selectedProduct && (
              <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 flex justify-between animate-fade-in">
                <span>
                  <strong>{selectedProduct.nama}</strong> (
                  {selectedProduct.unit})
                </span>
                <span>
                  Harga Jual:{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    selectedProduct.harga_jual
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Qty
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={tempQty}
                  onChange={(e) => setTempQty(Number(e.target.value))}
                  onKeyDown={handleQtyEnter}
                  disabled={!selectedProduct}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Harga Beli (@)
                </label>
                <input
                  ref={hargaInputRef}
                  type="number"
                  min="0"
                  value={tempHargaBeli}
                  onChange={(e) => setTempHargaBeli(Number(e.target.value))}
                  onKeyDown={handleHargaEnter}
                  disabled={!selectedProduct}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={!selectedProduct}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition-all disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              + Masukkan ke Daftar
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h3 className="font-bold text-slate-800">Rincian Barang Masuk</h3>
          <span className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-600">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-auto p-0 min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm">
              <tr>
                <th className="px-6 py-3">Barang</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-right">Harga Beli</th>
                <th className="px-6 py-3 text-right">Subtotal</th>
                <th className="px-6 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cart.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="text-4xl mb-2">🚚</div>
                    Belum ada barang di daftar nota ini.
                    <br />
                    <span className="text-xs">
                      Cari barang & tekan Enter untuk input cepat.
                    </span>
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {item.nama}
                      <div className="text-[10px] text-slate-400">
                        {item.kode_produk}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {item.qty} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      {new Intl.NumberFormat("id-ID").format(item.harga_beli)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-blue-600">
                      {new Intl.NumberFormat("id-ID").format(item.subtotal)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
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

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total Nilai Nota</span>
            <span className="text-3xl font-bold text-slate-800">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(grandTotal)}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={cart.length === 0 && !noNota}
              className="px-6 py-3 rounded-xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || isSubmitting || !!invoiceError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:shadow-none flex justify-center gap-2"
            >
              {isSubmitting ? "Menyimpan..." : "✅ Simpan Barang Masuk"}
            </button>
          </div>
        </div>
      </div>

      <QuickAddProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        initialName={modalInitialName}
        onSuccess={(newProduct) => {
          handleProductSelect(newProduct);
          addToast(
            `Produk baru "${newProduct.nama}" siap digunakan`,
            "success"
          );
        }}
      />
    </div>
  );
}
