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
  Calendar
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

  // --- STATE UTAMA ---
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split("T")[0]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE INPUT MANUAL (ORIGINAL) ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number | string>(1);

  // --- STATE MODE KATALOG ---
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const [activePicker, setActivePicker] = useState<any>(null); // Untuk Modal Qty Desimal
  const [pickerQty, setPickerQty] = useState<string>("1");

  const qtyInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<{ focus: () => void }>(null);
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // 1. Load Draft & Auth
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try { setCart(JSON.parse(savedDraft)); } catch (e) { console.error(e); }
    }
    if (userRole === "admin") {
      if (!localStorage.getItem("po_last_outlet")) setSelectedOutlet("");
    } else {
      setSelectedOutlet(userOutlet || "");
    }
  }, [userRole, userOutlet]);

  // 2. Auto Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Logic Filter
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const nama = p.nama || "";
      const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? nama.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [searchQuery, selectedAlphabet, products]);

  // --- HANDLER INTI ---

  const handleAddItem = (product: any, amount: number | string) => {
    const numQty = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
    
    if (!product) return addToast("Pilih produk dulu!", "error");
    if (isNaN(numQty) || numQty <= 0) return addToast("Jumlah tidak valid!", "error");
    if (numQty > product.sisa_stok) {
      addToast(`Stok kurang! Sisa: ${product.sisa_stok} ${product.unit}`, "error");
      return;
    }

    const existingIdx = cart.findIndex((item) => item.product_id === product.id);

    if (existingIdx >= 0) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].qty + numQty;

      if (newQty > product.sisa_stok) {
        addToast("Total melebihi sisa stok!", "error");
        return;
      }
      updatedCart[existingIdx].qty = newQty;
      updatedCart[existingIdx].subtotal = newQty * product.harga_jual;
      setCart(updatedCart);
      addToast(`Jumlah ${product.nama} diperbarui`, "info");
    } else {
      setCart([...cart, {
        product_id: product.id,
        nama: product.nama,
        kode: product.kode_produk,
        unit: product.unit,
        qty: numQty,
        harga_jual: product.harga_jual,
        subtotal: numQty * product.harga_jual,
      }]);
      addToast("Produk ditambahkan", "success");
    }

    // Reset Input Manual
    if (!activePicker) {
      setQty(1);
      setSelectedProduct(null);
      setTimeout(() => comboboxRef.current?.focus(), 50);
    } else {
      setActivePicker(null);
      setPickerQty("1");
    }
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[idx];
    const productRef = products.find(p => p.id === item.product_id);
    
    const newQty = item.qty + delta;
    if (newQty <= 0) return handleRemoveItem(idx);
    
    if (productRef && newQty > productRef.sisa_stok) {
      return addToast("Mencapai batas stok!", "error");
    }

    updatedCart[idx].qty = newQty;
    updatedCart[idx].subtotal = newQty * item.harga_jual;
    setCart(updatedCart);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) localStorage.removeItem(STORAGE_KEY);
    addToast("Item dihapus", "info");
  };

  const handleSubmit = async () => {
    if (!selectedOutlet) return addToast("Pilih Outlet tujuan!", "error");
    if (cart.length === 0) return addToast("Keranjang kosong!", "error");
    
    setLoading(true);
    const result = await createPurchaseOrder({
      outlet: selectedOutlet,
      tanggalKirim,
      items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, harga_jual: i.harga_jual }))
    });
    setLoading(false);

    if (result.error) addToast(result.error, "error");
    else {
      addToast("PO Berhasil disimpan!", "success");
      setCart([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const totalEstimasi = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6">
      {/* HEADER & TOGGLE */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">ASSTRO PURCHASE ORDER</h2>
        </div>
        <button 
          onClick={() => setIsQuickMode(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
        >
          <LayoutGrid size={18} /> Katalog Produk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: INFO & MANUAL INPUT */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest"><Store size={16}/> Detail Pengiriman</h3>
             <div className="space-y-4">
                <select 
                  value={selectedOutlet} 
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                >
                  <option value="">-- Pilih Outlet --</option>
                  {outlets.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input 
                  type="date" 
                  value={tanggalKirim} 
                  onChange={(e) => setTanggalKirim(e.target.value)}
                  className="w-full p-3 border rounded-xl font-bold text-slate-700 outline-none"
                />
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest"><Plus size={16}/> Input Manual</h3>
             <div className="space-y-4">
                <ProductCombobox ref={comboboxRef} products={products} onSelect={(p) => { setSelectedProduct(p); setQty(1); }} />
                <div className="flex gap-2">
                   <input 
                    type="number" step="0.01" value={qty} 
                    onChange={(e) => setQty(e.target.value)} 
                    className="flex-1 p-3 border rounded-xl font-bold outline-none" 
                    placeholder="Jumlah"
                   />
                   <button onClick={() => handleAddItem(selectedProduct, qty)} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-indigo-600 transition-colors"><Plus/></button>
                </div>
             </div>
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG UTAMA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCartIcon size={20}/> Item Pesanan ({cart.length})</h3>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimasi</p>
                  <p className="text-xl font-black text-indigo-600 leading-none">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
               </div>
            </div>

            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-6 py-4 text-center">Jumlah</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 uppercase leading-tight">{item.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">{item.kode} • Rp {item.harga_jual?.toLocaleString('id-ID')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateCartQty(idx, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-all text-slate-400"><Minus size={14}/></button>
                            <span className="font-black text-slate-700 w-12 text-center">{item.qty} <span className="text-[10px] font-medium text-slate-400">{item.unit}</span></span>
                            <button onClick={() => updateCartQty(idx, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-green-50 hover:text-green-600 transition-all text-slate-400"><Plus size={14}/></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

            <div className="p-6 border-t bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
               <button onClick={() => { setCart([]); localStorage.removeItem(STORAGE_KEY); }} className="px-6 py-3 font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">Reset</button>
               <button onClick={handleSubmit} disabled={loading || cart.length === 0} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                 {loading ? "Memproses..." : "SIMPAN PESANAN"}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODE KATALOG --- */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[999] flex flex-col animate-in fade-in duration-200">
          <div className="bg-white h-full flex flex-col lg:max-w-7xl lg:mx-auto lg:my-10 lg:rounded-[3rem] lg:h-[90vh] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white">
               <div className="flex items-center gap-4">
                  <button onClick={() => setIsQuickMode(false)} className="bg-slate-100 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Katalog Gudang</h2>
               </div>
               <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Draft Pesanan</p>
                     <p className="text-xl font-black text-indigo-600">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
                  </div>
                  <button onClick={() => setIsQuickMode(false)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black tracking-widest text-xs uppercase">Selesai</button>
               </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
               {/* Sidebar AZ */}
               <div className="w-16 sm:w-20 bg-slate-50 border-r flex flex-col items-center py-6 gap-2 overflow-y-auto">
                  <button onClick={() => setSelectedAlphabet("")} className={`w-12 h-12 rounded-2xl font-black text-[10px] ${selectedAlphabet === "" ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>ALL</button>
                  {alphabets.map(c => (
                    <button key={c} onClick={() => setSelectedAlphabet(c)} className={`w-12 h-12 rounded-2xl font-black text-xs ${selectedAlphabet === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{c}</button>
                  ))}
               </div>

               <div className="flex-1 flex flex-col">
                  <div className="p-4 bg-white border-b shadow-sm">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                      <input 
                        type="text" placeholder="Cari barang..." 
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {filteredProducts.map(p => {
                      const inCart = cart.find(i => i.product_id === p.id);
                      return (
                        <button key={p.id} onClick={() => setActivePicker(p)} className={`p-4 rounded-3xl border-2 text-left transition-all active:scale-95 relative group flex flex-col justify-between ${inCart ? 'border-indigo-600 bg-white shadow-xl' : 'border-slate-50 bg-slate-50 hover:border-indigo-200'}`}>
                           <div className="mb-2 pr-6">
                              <p className="font-black text-slate-800 uppercase text-[12px] leading-tight h-8 overflow-hidden">{p.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-1">{p.kode_produk}</p>
                           </div>
                           <div className="flex justify-between items-end">
                              <p className="text-xs font-black text-indigo-600 tracking-tighter">Rp {p.harga_jual?.toLocaleString('id-ID')}</p>
                              {inCart && <div className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black">{inCart.qty}</div>}
                           </div>
                           {inCart && <div className="absolute top-2 right-2 text-indigo-600 animate-pulse"><CheckCircle2 size={16}/></div>}
                        </button>
                      )
                    })}
                  </div>
               </div>
            </div>
          </div>

          {/* --- MINI MODAL QTY (Untuk Input Desimal) --- */}
          {activePicker && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[1000] p-6 animate-in zoom-in duration-200">
               <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
                  <div className="text-center mb-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Input Jumlah</p>
                     <h4 className="text-lg font-black text-slate-800 uppercase leading-tight">{activePicker.nama}</h4>
                     <p className="text-xs font-bold text-indigo-500 mt-1">Sisa Stok: {activePicker.sisa_stok} {activePicker.unit}</p>
                  </div>
                  
                  <div className="relative mb-6">
                    <input 
                      autoFocus
                      type="number" step="0.01" 
                      className="w-full text-center text-4xl font-black py-4 bg-slate-50 rounded-3xl border-none outline-none focus:ring-4 focus:ring-indigo-500/20"
                      value={pickerQty}
                      onChange={(e) => setPickerQty(e.target.value)}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase text-xs">{activePicker.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setActivePicker(null)} className="py-4 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-xs">Batal</button>
                     <button onClick={() => handleAddItem(activePicker, pickerQty)} className="bg-indigo-600 py-4 rounded-2xl text-white font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase text-xs">Masukkan</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
