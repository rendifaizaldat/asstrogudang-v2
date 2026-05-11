"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPurchaseOrder } from "@/app/(dashboard)/purchase-order/actions";
import {
  Trash2,
  Plus,
  Save,
  ShoppingCart as ShoppingCartIcon,
  LayoutGrid,
  X,
  Search,
  ArrowLeft
} from "lucide-react";
import ProductCombobox from "@/components/form/ProductCombobox";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { addToast } = useToast();

  // State Utama (Original)
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tanggalKirim, setTanggalKirim] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Input Produk (Original)
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  // State Tambahan untuk Mode Katalog
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");

  const qtyInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<{ focus: () => void }>(null);

  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // 1. Load Draft (Original Logic)
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

  // 2. Auto Save Draft (Original Logic)
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  // Logic Filter untuk Mode Katalog (Menyesuaikan dengan p.nama produk asli)
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const namaProduk = p.nama || "";
      const matchesSearch = namaProduk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? namaProduk.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [searchQuery, selectedAlphabet, products]);

  // Handler Select Product (Original)
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

  // Handler Add Item (Original Logic - Dipertahankan 100%)
  const handleAddItem = (manualProduct?: any) => {
    const targetProduct = manualProduct || selectedProduct;
    const targetQty = manualProduct ? 1 : qty;

    if (!targetProduct) return addToast("Pilih produk dulu!", "error");
    if (targetQty <= 0) return addToast("Jumlah minimal 1", "error");

    if (targetQty > targetProduct.sisa_stok) {
      addToast(`Stok kurang! Sisa: ${targetProduct.sisa_stok} ${targetProduct.unit}`, "error");
      return;
    }

    const existingIdx = cart.findIndex((item) => item.product_id === targetProduct.id);

    if (existingIdx >= 0) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].qty + targetQty;

      if (newQty > targetProduct.sisa_stok) {
        addToast("Total jumlah melebihi sisa stok!", "error");
        return;
      }
      updatedCart[existingIdx].qty = newQty;
      updatedCart[existingIdx].subtotal = newQty * targetProduct.harga_jual;
      setCart(updatedCart);
      addToast(`Qty ${targetProduct.nama} diperbarui`, "info");
    } else {
      setCart([
        ...cart,
        {
          product_id: targetProduct.id,
          nama: targetProduct.nama,
          kode: targetProduct.kode_produk,
          unit: targetProduct.unit,
          qty: targetQty,
          harga_jual: targetProduct.harga_jual,
          subtotal: targetQty * targetProduct.harga_jual,
        },
      ]);
      addToast("Produk ditambahkan", "success");
    }

    if (!manualProduct) {
        setQty(1);
        setSelectedProduct(null);
        setTimeout(() => comboboxRef.current?.focus(), 50);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) localStorage.removeItem(STORAGE_KEY);
    addToast("Item dihapus", "info");
  };

  const handleReset = () => {
    setCart([]);
    if (userRole === "admin") setSelectedOutlet("");
    localStorage.removeItem(STORAGE_KEY);
    addToast("Formulir berhasil direset", "info");
  };

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
      if (userRole === "admin") setSelectedOutlet("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const totalEstimasi = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="relative">
      {/* TOMBOL TOGGLE MODE CEPAT */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsQuickMode(true)}
          className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-200 transition-all active:scale-95 border border-indigo-200"
        >
          <LayoutGrid size={18} /> Mode Katalog (Input Cepat)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAGIAN KIRI: INPUT FORM (ORIGINAL) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              📝 Detail Pesanan
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outlet Tujuan</label>
                {userRole === "admin" ? (
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Pilih Outlet --</option>
                    {outlets.map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                ) : (
                  <input value={userOutlet} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 cursor-not-allowed font-medium" />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rencana Kirim</label>
                <input type="date" value={tanggalKirim} onChange={(e) => setTanggalKirim(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative z-50">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">📦 Tambah Barang</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cari Produk {selectedProduct ? `(Dipilih: ${selectedProduct.nama})` : ""}</label>
                <ProductCombobox ref={comboboxRef} products={products} onSelect={handleProductSelect} placeholder="Ketik nama produk... (Enter)" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah</label>
                <div className="flex gap-2">
                  <input ref={qtyInputRef} type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} onKeyDown={handleQtyKeyDown} className="flex-1 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <button onClick={() => handleAddItem()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"><Plus size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN KANAN: TABEL KERANJANG (ORIGINAL) */}
        <div className="lg:col-span-2 flex flex-col h-full z-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="font-bold text-lg text-slate-800">Keranjang ({cart.length} item)</h3>
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalEstimasi)}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  <ShoppingCartIcon size={48} className="mb-2 opacity-20" /><p>Belum ada barang dipilih.</p>
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
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{item.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.kode}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-white border border-slate-200 px-2 py-1 rounded font-bold text-slate-600">{item.qty} {item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{new Intl.NumberFormat("id-ID").format(item.harga_jual)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{new Intl.NumberFormat("id-ID").format(item.subtotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={handleReset} disabled={cart.length === 0} className="px-6 py-3 rounded-xl border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors disabled:opacity-50">Reset</button>
              <button onClick={handleSubmit} disabled={loading || cart.length === 0} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all active:scale-95">
                {loading ? "Memproses..." : <><Save size={20} /> Simpan Pesanan</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODE KATALOG (FITUR TAMBAHAN) --- */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex flex-col animate-in fade-in duration-200">
          <div className="bg-white h-full flex flex-col">
            {/* Header Modal */}
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsQuickMode(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24}/></button>
                <h2 className="font-bold text-xl">Katalog Produk</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Estimasi</p>
                    <p className="font-bold text-indigo-600">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
                </div>
                <button onClick={() => setIsQuickMode(false)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm">Selesai</button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Filter A-Z */}
                <div className="w-14 border-r bg-slate-50 flex flex-col items-center py-4 gap-1 overflow-y-auto">
                    <button onClick={() => setSelectedAlphabet("")} className={`w-10 h-10 rounded-lg text-xs font-bold ${selectedAlphabet === "" ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>ALL</button>
                    {alphabets.map(char => (
                        <button key={char} onClick={() => setSelectedAlphabet(char)} className={`w-10 h-10 rounded-lg text-xs font-bold ${selectedAlphabet === char ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{char}</button>
                    ))}
                </div>

                {/* Grid Produk */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="text" placeholder="Cari nama produk..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                        {filteredProducts.map(product => {
                            const inCart = cart.find(c => c.product_id === product.id);
                            return (
                                <button 
                                    key={product.id}
                                    onClick={() => handleAddItem(product)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between relative ${inCart ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200 shadow-sm'}`}
                                >
                                    <div className="mb-2">
                                        <p className="font-bold text-slate-800 leading-tight text-sm uppercase">{product.nama}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1">{product.kode_produk}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-indigo-600">Rp {product.harga_jual?.toLocaleString('id-ID')}</p>
                                        {inCart && (
                                            <div className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                                {inCart.qty}x
                                            </div>
                                        )}
                                    </div>
                                    {inCart && <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm"><LayoutGrid size={12}/></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
