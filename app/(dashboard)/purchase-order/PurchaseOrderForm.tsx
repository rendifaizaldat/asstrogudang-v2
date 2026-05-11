"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Plus, Minus, Trash2, LayoutGrid, 
  CheckCircle2, ArrowLeft, Save, ShoppingCart, X
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
  
  // --- STATE FILTER ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");

  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Logic Pencarian & Filter A-Z
  const filteredProducts = useMemo(() => {
    const list = products || [];
    return list.filter(p => {
      const nama = p.nama_produk || "";
      const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? nama.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => (a.nama_produk || "").localeCompare(b.nama_produk || ""));
  }, [searchQuery, selectedAlphabet, products]);

  // Logic Keranjang
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

  // --- VIEW 1: FORM UTAMA (Tampilan Desktop Awal) ---
  if (!isQuickMode) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">PURCHASE ORDER</h1>
            <p className="text-slate-500 font-medium mt-1">Kelola pesanan barang antar cabang ASSTRO.</p>
          </div>
          <button 
            onClick={() => setIsQuickMode(true)}
            className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-3xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95 text-sm uppercase tracking-widest"
          >
            <LayoutGrid size={20} /> Mode Katalog Cepat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <CheckCircle2 className="text-indigo-600" size={16}/> Informasi Pengiriman
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Outlet Tujuan</label>
                        <select 
                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                            value={outletId}
                            onChange={(e) => setOutletId(e.target.value)}
                        >
                            <option value="">Pilih Outlet...</option>
                            {outlets?.map(o => <option key={o.id} value={o.id}>{o.nama_outlet}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Tanggal Kirim</label>
                        <input 
                            type="date"
                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-16 text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                    <ShoppingCart className="text-slate-300" size={40} />
                </div>
                <h4 className="text-slate-400 font-black text-lg uppercase tracking-tighter">Keranjang Belum Terisi</h4>
                <p className="text-slate-400 mt-2 max-w-[280px]">Silahkan klik tombol "Mode Katalog Cepat" untuk mulai memilih barang.</p>
            </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: MODE KATALOG (Panel Tablet) ---
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden font-sans select-none animate-in slide-in-from-bottom duration-500">
      
      {/* NAVIGATION BAR */}
      <div className="bg-slate-900 text-white p-5 flex justify-between items-center px-8 border-b border-slate-800">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsQuickMode(false)} className="bg-slate-800 p-3 rounded-2xl hover:bg-red-500 transition-all active:scale-90">
            <X size={24} />
          </button>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Outlet</p>
            <p className="font-black text-indigo-400 truncate max-w-[200px] text-lg leading-tight uppercase tracking-tight">
                {outlets?.find(o => o.id === outletId)?.nama_outlet || "Pilih Cabang!"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Estimasi Harga</p>
          <p className="text-3xl font-black text-green-400 tabular-nums tracking-tighter">Rp {totalHarga.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL A: INDEX A-Z */}
        <div className="w-20 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-6 gap-2 overflow-y-auto shrink-0 shadow-inner">
          <button 
            onClick={() => setSelectedAlphabet("")}
            className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${selectedAlphabet === "" ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
          >ALL</button>
          {alphabets.map(char => (
            <button 
              key={char}
              onClick={() => setSelectedAlphabet(char)}
              className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${selectedAlphabet === char ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
            >
              {char}
            </button>
          ))}
        </div>

        {/* PANEL B: GRID BARANG */}
        <div className="flex-1 flex flex-col bg-slate-100/30">
          <div className="p-6 bg-white border-b border-slate-200 shadow-sm">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
              <input 
                type="text"
                placeholder="Cari barang di gudang..."
                className="w-full pl-14 pr-8 py-5 bg-slate-50 rounded-[2rem] border-2 border-transparent outline-none focus:border-indigo-500 focus:bg-white transition-all font-black text-slate-700 text-lg uppercase placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-6 rounded-[2.5rem] border-4 text-left transition-all active:scale-95 flex justify-between items-start relative overflow-hidden group ${inCart ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-100' : 'border-white bg-white hover:border-indigo-200 shadow-sm shadow-slate-200'}`}
                >
                  <div className="flex-1 pr-2">
                    <p className="font-black text-slate-800 leading-[1.1] mb-2 text-sm uppercase tracking-tight h-10 overflow-hidden">{product.nama_produk}</p>
                    <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full uppercase tracking-widest">Rp {product.harga_beli?.toLocaleString('id-ID')}</p>
                  </div>
                  {inCart && (
                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-200 animate-in zoom-in shrink-0">
                      {inCart.quantity}x
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL C: KERANJANG UTAMA */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-xl uppercase tracking-tighter">
              <ShoppingCart size={24} className="text-indigo-600" /> Pesanan
            </h3>
            <span className="bg-indigo-600 text-white px-5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">{cart.length} Jenis</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <ShoppingCart size={80} strokeWidth={1} />
                <p className="font-black text-sm mt-4 uppercase tracking-[0.3em]">Kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="font-black text-[12px] text-slate-800 uppercase leading-tight mb-4 truncate tracking-tight">{item.nama_produk}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                      <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all rounded-xl text-slate-400 bg-slate-50"><Minus size={18} strokeWidth={4}/></button>
                      <span className="w-12 text-center font-black text-slate-900 text-xl tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all rounded-xl text-slate-400 bg-slate-50"><Plus size={18} strokeWidth={4}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all rounded-2xl"><Trash2 size={24} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CHECKOUT SECTION */}
          <div className="p-8 bg-white border-t border-slate-100 space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-end">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Total Bayar</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">Rp {totalHarga.toLocaleString('id-ID')}</p>
            </div>
            <button 
              disabled={cart.length === 0 || !outletId}
              className={`w-full py-7 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 tracking-tighter uppercase ${cart.length === 0 || !outletId ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-300'}`}
            >
              <Save size={28} /> Simpan PO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
