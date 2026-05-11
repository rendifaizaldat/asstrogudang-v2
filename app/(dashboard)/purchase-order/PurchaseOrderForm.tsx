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
  ArrowLeft,
  Minus,
  CheckCircle2,
  Store,
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

  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split("T")[0]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");

  const comboboxRef = useRef<{ focus: () => void }>(null);
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try { setCart(JSON.parse(savedDraft)); } catch (e) { console.error(e); }
    }
    if (userRole !== "admin") setSelectedOutlet(userOutlet || "");
  }, [userRole, userOutlet]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Fix Decimal Logic
  const cleanNum = (num: number) => Math.round(num * 100) / 100;

  const handleUpdateQty = (productId: string, newQty: number | string) => {
    let val = typeof newQty === "string" ? parseFloat(newQty.replace(",", ".")) : newQty;
    if (isNaN(val) || val < 0) val = 0;

    const productRef = products.find(p => p.id === productId);
    if (!productRef) return;

    if (val > productRef.sisa_stok) {
      addToast(`Stok hanya sisa: ${productRef.sisa_stok}`, "error");
      val = productRef.sisa_stok;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product_id === productId);
      
      if (val === 0) {
        return prev.filter(item => item.product_id !== productId);
      }

      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx] = {
          ...newCart[existingIdx],
          qty: cleanNum(val),
          subtotal: cleanNum(val * newCart[existingIdx].harga_jual)
        };
        return newCart;
      } else {
        return [...prev, {
          product_id: productRef.id,
          nama: productRef.nama,
          kode: productRef.kode_produk,
          unit: productRef.unit,
          qty: cleanNum(val),
          harga_jual: productRef.harga_jual,
          subtotal: cleanNum(val * productRef.harga_jual),
        }];
      }
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
    addToast("Item dihapus", "info");
  };

  const handleSubmit = async () => {
    if (!selectedOutlet || cart.length === 0) return addToast("Data belum lengkap!", "error");
    setLoading(true);
    const result = await createPurchaseOrder({
      outlet: selectedOutlet,
      tanggalKirim,
      items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, harga_jual: i.harga_jual }))
    });
    setLoading(false);
    if (!result.error) {
      addToast("PO Berhasil disimpan!", "success");
      setCart([]);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      addToast(result.error, "error");
    }
  };

  const totalEstimasi = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const n = p.nama || "";
      return n.toLowerCase().includes(searchQuery.toLowerCase()) && 
             (selectedAlphabet ? n.toUpperCase().startsWith(selectedAlphabet) : true);
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [searchQuery, selectedAlphabet, products]);

  return (
    <div className="space-y-6 pb-10">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Purchase Order</h2>
        <button onClick={() => setIsQuickMode(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all">
          <LayoutGrid size={18} /> Katalog Cepat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM LEFT */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest"><Store size={16}/> Pengiriman</h3>
             <div className="space-y-4">
                <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-slate-700 outline-none">
                  <option value="">-- Pilih Outlet --</option>
                  {outlets.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input type="date" value={tanggalKirim} onChange={(e) => setTanggalKirim(e.target.value)} className="w-full p-3 border rounded-xl font-bold text-slate-700 outline-none" />
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative z-50">
             <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest"><Search size={16}/> Cari Barang</h3>
             <ProductCombobox ref={comboboxRef} products={products} onSelect={(p) => handleUpdateQty(p.id, 1)} />
          </div>
        </div>

        {/* TABLE KERANJANG */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center rounded-t-2xl">
              <span className="font-black text-slate-800 uppercase text-sm">Item Pesanan ({cart.length})</span>
              <span className="font-black text-indigo-600">Total: Rp {totalEstimasi.toLocaleString('id-ID')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3 text-left">Produk</th>
                    <th className="px-6 py-3 text-center w-48">Qty</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-center w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cart.map((item, idx) => (
                    <tr key={item.product_id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800 uppercase text-xs">{item.nama}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleUpdateQty(item.product_id, cleanNum(item.qty - 1))} className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><Minus size={14}/></button>
                          <input 
                            type="number" step="0.01" value={item.qty} 
                            onChange={(e) => handleUpdateQty(item.product_id, e.target.value)}
                            className="w-20 text-center font-black text-slate-700 bg-slate-50 rounded-md py-1 outline-none border border-transparent focus:border-indigo-500"
                          />
                          <button onClick={() => handleUpdateQty(item.product_id, cleanNum(item.qty + 1))} className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-400 hover:bg-green-50 hover:text-green-500 transition-all"><Plus size={14}/></button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleRemoveItem(item.product_id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 mt-auto border-t bg-slate-50 flex justify-end rounded-b-2xl">
               <button onClick={handleSubmit} disabled={loading || cart.length === 0} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs">Simpan PO</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODE KATALOG --- */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white shadow-xl">
            <button onClick={() => setIsQuickMode(false)} className="flex items-center gap-2 font-bold px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"><ArrowLeft/> Kembali</button>
            <div className="text-center flex-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Katalog Input</p>
               <p className="font-black text-indigo-400 text-lg tabular-nums">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
            </div>
            <button onClick={() => setIsQuickMode(false)} className="bg-indigo-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Selesai</button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-16 bg-slate-50 border-r flex flex-col items-center py-4 gap-1 overflow-y-auto shrink-0 shadow-inner">
               <button onClick={() => setSelectedAlphabet("")} className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${selectedAlphabet === "" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-white'}`}>ALL</button>
               {alphabets.map(c => <button key={c} onClick={() => setSelectedAlphabet(c)} className={`w-11 h-11 rounded-xl text-xs font-bold transition-all ${selectedAlphabet === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>{c}</button>)}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/30">
               <div className="p-4 bg-white shadow-sm">
                 <input type="text" placeholder="Cari nama barang..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
               <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4 content-start pb-20">
                 {filteredProducts.map(p => {
                    const inCart = cart.find(i => i.product_id === p.id);
                    return (
                      <div key={p.id} className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col justify-between h-44 shadow-sm ${inCart ? 'border-indigo-600 bg-white scale-[1.02]' : 'border-white bg-white hover:border-slate-200'}`}>
                         <div>
                            <p className="font-black text-slate-800 uppercase text-[11px] leading-tight line-clamp-2 h-8">{p.nama}</p>
                            <p className="text-[10px] font-bold text-indigo-500 mt-1">Rp {p.harga_jual?.toLocaleString('id-ID')}</p>
                         </div>
                         <div className="mt-auto">
                            {inCart ? (
                              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1 justify-between border border-slate-100 shadow-inner">
                                <button onClick={() => handleUpdateQty(p.id, cleanNum(inCart.qty - 1))} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm text-red-500 active:scale-90 transition-all"><Minus size={14}/></button>
                                <span className="font-black text-xs tabular-nums text-slate-700">{inCart.qty}</span>
                                <button onClick={() => handleUpdateQty(p.id, cleanNum(inCart.qty + 1))} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm text-green-500 active:scale-90 transition-all"><Plus size={14}/></button>
                              </div>
                            ) : (
                              <button onClick={() => handleUpdateQty(p.id, 1)} className="w-full py-3 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-600 hover:text-white transition-all active:scale-95">+ Tambah</button>
                            )}
                         </div>
                      </div>
                    )
                 })}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
