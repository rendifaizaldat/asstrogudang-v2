// app/(dashboard)/barang-masuk/BarangMasukForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ProductCombobox from "@/components/form/ProductCombobox";
import QuickAddProductModal from "@/components/form/QuickAddProductModal";
import { submitBarangMasuk, checkInvoiceExists } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Camera, Loader2, Sparkles } from "lucide-react"; // Icon tambahan

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
  const [isScanning, setIsScanning] = useState(false); // State Scanning
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

  // --- LOGIC OCR SCAN ---
  const handleScanNota = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: User harus pilih vendor dulu agar AI lebih terarah (Opsional, tapi disarankan)
    if (!selectedVendor) {
      if (
        !confirm(
          "Anda belum memilih Vendor. Lanjutkan scan tanpa referensi vendor?"
        )
      ) {
        e.target.value = "";
        return;
      }
    }

    if (file.size > 4 * 1024 * 1024) {
      addToast("Ukuran file maksimal 4MB", "error");
      return;
    }

    try {
      setIsScanning(true);
      addToast("AI sedang membaca item barang...", "info");

      const formData = new FormData();
      formData.append("file", file);
      // Kirim vendor yang dipilih user untuk konteks AI
      formData.append("vendorName", selectedVendor);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const { data, error } = await res.json();

      if (error) throw new Error(error);

      // --- PERUBAHAN DISINI: HAPUS AUTO-FILL HEADER ---
      // Kita tidak lagi mengubah selectedVendor, noNota, atau tglNota.
      // Biarkan user yang mengisinya secara manual.

      /* if (data.vendor_match) setSelectedVendor(data.vendor_match);
      if (data.no_nota) setNoNota(data.no_nota);
      if (data.tanggal) setTglNota(data.tanggal); 
      */

      // 2. Auto Fill Items Saja
      const newItems: CartItem[] = [];
      let successCount = 0;

      data.items.forEach((ocrItem: any) => {
        if (ocrItem.product_id) {
          const fullProduct = products.find((p) => p.id === ocrItem.product_id);

          if (fullProduct) {
            successCount++;
            newItems.push({
              ...fullProduct,
              qty: ocrItem.qty || 1,
              harga_beli: ocrItem.harga_satuan || fullProduct.harga_beli || 0,
              subtotal: (ocrItem.qty || 1) * (ocrItem.harga_satuan || 0),
            });
          }
        }
      });

      if (newItems.length > 0) {
        setCart((prev) => [...prev, ...newItems]);
        addToast(
          `Berhasil menambahkan ${successCount} item ke daftar!`,
          "success"
        );
      } else {
        addToast(
          "Tidak ditemukan item yang cocok dengan database produk.",
          "info"
        );
      }
    } catch (err: any) {
      console.error(err);
      addToast("Gagal scan: " + err.message, "error");
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

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

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-xl">📥</span> Input Barang
            </h3>
          </div>

          {/* TOMBOL SCAN AI */}
          <div className="mb-6">
            <label
              className={`
              flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all relative overflow-hidden group
              ${
                isScanning
                  ? "bg-indigo-50 border-indigo-300 text-indigo-400 cursor-wait"
                  : "bg-slate-50 border-slate-300 text-slate-500 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600"
              }
            `}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleScanNota}
                disabled={isScanning}
                className="hidden"
              />
              {isScanning ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-bold animate-pulse">
                    AI Sedang Menganalisa...
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold flex items-center gap-1">
                      Scan Nota Otomatis{" "}
                      <Sparkles size={12} className="text-yellow-500" />
                    </span>
                    <span className="text-[10px] opacity-70">
                      Upload foto nota, AI akan mengisi data.
                    </span>
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Cari Produk Manual
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
                      Scan nota atau cari barang manual.
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
