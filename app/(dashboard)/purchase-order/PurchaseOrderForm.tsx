"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { 
  Search, Plus, Minus, Trash2, LayoutGrid, 
  CheckCircle2, ArrowLeft, Save, ShoppingCart, X
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Interface lokal untuk menghindari error TS
interface Product {
  id: string;
  nama_produk: string;
  harga_beli?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PurchaseOrderForm({ outlets, products }: { outlets: any[], products: Product[] }) {
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const { register, watch, setValue } = useForm({
    defaultValues: {
      outlet_id: "",
      tanggal: new Date().toISOString().split('T')[0],
    }
  });

  const selectedOutletId = watch("outlet_id");
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchesSearch = p.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? p.nama_produk?.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
  }, [searchQuery, selectedAlphabet, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.nama_produk} masuk keranjang`, { position: 'bottom-center' });
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

  // VIEW UTAMA (DESKTOP)
  if (!isQuickMode) {
    return (
      <div className="p-6">
        <Toaster />
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Purchase Order</h1>
            <p className="text-slate-500">Pilih mode untuk mulai menginput pesanan.</p>
          </div>
          <button 
            onClick={() => setIsQuickMode(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
          >
            <LayoutGrid size={20} /> Buka Mode Input Cepat
          </button>
        </div>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Keranjang Masih Kosong</h3>
            <p className="text-slate-500 mb-6">Klik tombol di pojok kanan atas untuk memilih barang dari katalog.</p>
        </div>
      </div>
    );
  }

  // VIEW QUICK INPUT (TABLET OPTIMIZED)
  return (
    <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col overflow-hidden font-sans text-slate-900">
      <Toaster />
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsQuickMode(false)} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Outlet Tujuan</p>
            <select 
              className="bg-transparent font-bold outline-none text-blue-400 cursor-pointer"
              value={selectedOutletId}
              onChange={(e) => setValue("outlet_id", e.target.value)}
            >
              <option value="" className="text-slate-900">-- Pilih Outlet --</option>
              {outlets?.map(o => <option key={o.id} value={o.id} className="text-slate-900">{o.nama_outlet}</option>)}
            </select>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400">Estimasi Total</p>
          <p className="text-xl font-black text-green-400 font-mono">Rp {totalHarga.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL A: ALPHABET */}
        <div className="w-14 bg-white border-r flex flex-col items-center py-4 gap-1 overflow-y-auto shadow-inner">
          <button 
            onClick={() => setSelectedAlphabet("")}
            className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${selectedAlphabet === "" ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          >ALL</button>
          {alphabets.map(char => (
            <button 
              key={char}
              onClick={() => setSelectedAlphabet(char)}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${selectedAlphabet === char ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {char}
            </button>
          ))}
        </div>

        {/* PANEL B: PRODUCTS */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Cari produk..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex justify-between items-start relative overflow-hidden ${inCart ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-white bg-white hover:border-slate-200 shadow-sm'}`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 leading-tight mb-1">{product.nama_produk}</p>
                    <p className="text-sm font-bold text-blue-600">Rp {product.harga_beli?.toLocaleString('id-ID')}</p>
                  </div>
                  {inCart && (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[10px] font-black animate-in zoom-in">
                      {inCart.quantity}x
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL C: CART */}
        <div className="w-80 md:w-96 bg-white border-l flex flex-col shadow-2xl">
          <div className="p-5 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-slate-700 flex items-center gap-2">
              <ShoppingCart size={18} /> Keranjang
            </h3>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold">{cart.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <ShoppingCart size={48} />
                <p className="text-sm font-bold mt-2">Belum ada item</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-sm text-slate-800 truncate mb-3">{item.nama_produk}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400"><Minus size={16}/></button>
                      <span className="w-10 text-center font-black text-slate-700">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400"><Plus size={16}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-slate-50 border-t space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-slate-500 font-bold text-sm">TOTAL</p>
              <p className="text-3xl font-black text-slate-900">Rp {totalHarga.toLocaleString('id-ID')}</p>
            </div>
            <button 
              disabled={cart.length === 0 || !selectedOutletId}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${cart.length === 0 || !selectedOutletId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}
            >
              <Save /> Simpan Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
