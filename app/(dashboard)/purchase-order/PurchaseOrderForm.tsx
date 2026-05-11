"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Plus, Minus, Trash2, LayoutGrid, 
  CheckCircle2, Save, ShoppingCart, X, Package, Calendar, Store
} from "lucide-react";

interface Product {
  id: string;
  nama_produk: string;
  harga_beli?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PurchaseOrderForm({ outlets, products }: { outlets: any[], products: Product[] }) {
  // --- STATE UTAMA ---
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [outletId, setOutletId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  
  // --- STATE FILTER & SEARCH ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");

  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Logic Pencarian (Digunakan di Tabel Utama & Mode Katalog)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const nama = p.nama_produk || "";
      const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? nama.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => (a.nama_produk || "").localeCompare(b.nama_produk || ""));
  }, [searchQuery, selectedAlphabet, products]);

  // Logic Keranjang (Add/Update/Remove)
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalHarga = cart.reduce((acc, item) => acc + (item.harga_beli || 0) * item.quantity, 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">PURCHASE ORDER</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs">Internal Stock Distribution System</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
                type="button"
                onClick={() => setIsQuickMode(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
            >
                <LayoutGrid size={20} /> Mode Katalog
            </button>
            <button 
                disabled={cart.length === 0 || !outletId}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${cart.length === 0 || !outletId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
                <Save size={20} /> Simpan Pesanan
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: FORM INFO & SUMMARY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 text-lg uppercase tracking-tight">
              <Store className="text-indigo-600" size={22}/> Informasi Pengiriman
            </h3>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Outlet Tujuan</label>
                <select 
                  className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all appearance-none outline-none"
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                >
                  <option value="">Pilih Outlet Tujuan...</option>
                  {outlets?.map(o => <option key={o.id} value={o.id}>{o.nama_outlet}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Tanggal Pengiriman</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="date"
                    className="w-full p-5 pl-14 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <ShoppingCart className="absolute -right-10 -bottom-10 text-indigo-800 opacity-50" size={200} />
            <p className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.3em] mb-2 relative z-10">Total Estimasi</p>
            <h2 className="text-5xl font-black tracking-tighter relative z-10">Rp {totalHarga.toLocaleString('id-ID')}</h2>
            <div className="mt-8 pt-6 border-t border-indigo-800 flex justify-between items-center relative z-10">
                <span className="text-indigo-300 font-bold">{cart.length} Jenis Barang</span>
                <span className="bg-indigo-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Draft</span>
            </div>
          </div>
        </div>

        {/* RIGHT: MAIN TABLE (THE ORIGINAL LIST) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Daftar Barang Pesanan</h3>
               <div className="relative w-full md:w-72 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari & tambah barang..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {/* Dropdown Hasil Cari Cepat */}
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-white mt-2 border border-slate-100 shadow-2xl rounded-2xl z-20 max-h-60 overflow-y-auto p-2 space-y-1">
                        {filteredProducts.length > 0 ? filteredProducts.slice(0, 5).map(p => (
                            <button 
                                key={p.id}
                                onClick={() => { addToCart(p); setSearchQuery(""); }}
                                className="w-full text-left p-4 hover:bg-slate-50 rounded-xl flex justify-between items-center group"
                            >
                                <span className="font-bold text-slate-700 uppercase text-xs">{p.nama_produk}</span>
                                <Plus size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        )) : <p className="p-4 text-xs text-slate-400 font-bold text-center italic">Barang tidak ditemukan</p>}
                    </div>
                  )}
               </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Produk</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Kuantitas</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {cart.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-32 text-center">
                                    <div className="flex flex-col items-center opacity-20">
                                        <Package size={64} />
                                        <p className="mt-4 font-black uppercase tracking-[0.2em] text-sm">Belum ada barang dipilih</p>
                                    </div>
                                </td>
                            </tr>
                        ) : cart.map(item => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.nama_produk}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Harga: Rp {item.harga_beli?.toLocaleString('id-ID')}</p>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-xl shadow-sm">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 transition-all"><Minus size={14}/></button>
                                        <span className="w-10 font-black text-slate-900 tabular-nums">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-green-600 transition-all"><Plus size={14}/></button>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="font-black text-slate-900 tabular-nums">Rp {((item.harga_beli || 0) * item.quantity).toLocaleString('id-ID')}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODE KATALOG (HANYA MUNCUL JIKA AKTIF) --- */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-10 animate-in fade-in duration-300">
           <div className="bg-white w-full h-[90vh] sm:h-full sm:max-w-6xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
                {/* Header Katalog */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <LayoutGrid size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-none">Pilih Barang</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tap untuk menambah ke pesanan</p>
                        </div>
                    </div>
                    <button onClick={() => setIsQuickMode(false)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-90">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Katalog */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Index A-Z */}
                    <div className="w-16 sm:w-20 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-6 gap-2 overflow-y-auto shrink-0 shadow-inner">
                        <button 
                            onClick={() => setSelectedAlphabet("")}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-[10px] font-black transition-all ${selectedAlphabet === "" ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
                        >ALL</button>
                        {alphabets.map(char => (
                            <button 
                                key={char}
                                onClick={() => setSelectedAlphabet(char)}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-xs font-black transition-all ${selectedAlphabet === char ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
                            >{char}</button>
                        ))}
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 bg-white border-b border-slate-100">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                <input 
                                    type="text"
                                    placeholder="Cari nama produk..."
                                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent outline-none focus:border-indigo-500 focus:bg-white transition-all font-black text-slate-700 uppercase tracking-tight"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                            {filteredProducts.map(product => {
                                const inCart = cart.find(c => c.id === product.id);
                                return (
                                    <button 
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`p-6 rounded-[2rem] border-4 text-left transition-all active:scale-95 flex justify-between items-center relative overflow-hidden group ${inCart ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100' : 'border-white bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="flex-1 pr-4">
                                            <p className="font-black text-slate-800 leading-tight uppercase text-xs mb-1 truncate">{product.nama_produk}</p>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Rp {product.harga_beli?.toLocaleString('id-ID')}</p>
                                        </div>
                                        {inCart ? (
                                            <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black animate-in zoom-in shrink-0">
                                                {inCart.quantity}x
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-300 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-all shrink-0">
                                                <Plus size={20} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Katalog */}
                <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                    <div className="hidden sm:block">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Dipilih</p>
                        <p className="text-2xl font-black text-indigo-600 tracking-tighter">Rp {totalHarga.toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                        onClick={() => setIsQuickMode(false)}
                        className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                    >
                        Tutup & Selesaikan <X size={18}/>
                    </button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
}
