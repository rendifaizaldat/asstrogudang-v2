"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { 
  Search, Plus, Minus, Trash2, LayoutGrid, 
  CheckCircle2, ArrowLeft, Save, ShoppingCart 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  nama_produk: string;
  harga_beli?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PurchaseOrderForm({ outlets, products }: { outlets: any[], products: Product[] }) {
  // 1. State untuk Toggle Mode
  const [isQuickMode, setIsQuickMode] = useState(false);
  
  // 2. State untuk Filter & Keranjang
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // 3. Form Header (Outlet & Tanggal)
  const { register, watch, setValue } = useForm({
    defaultValues: {
      outlet_id: "",
      tanggal: new Date().toISOString().split('T')[0],
    }
  });

  const selectedOutlet = watch("outlet_id");
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Logic: Filter Produk
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? p.nama_produk.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
  }, [searchQuery, selectedAlphabet, products]);

  // Logic: Keranjang
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.nama_produk} ditambah`, { duration: 1000, position: 'bottom-center' });
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

  // --- RENDER VIEW 1: ORIGINAL (DESKTOP) ---
  if (!isQuickMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Purchase Order</h1>
            <p className="text-sm text-muted-foreground">Buat pesanan barang baru untuk outlet.</p>
          </div>
          <Button onClick={() => setIsQuickMode(true)} variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <LayoutGrid className="w-4 h-4" /> Mode Input Cepat (Tablet)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader><CardTitle className="text-sm font-medium">Detail Pesanan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Outlet Tujuan</label>
                <Select onValueChange={(val) => setValue("outlet_id", val)}>
                  <SelectTrigger><SelectValue placeholder="Pilih Outlet" /></SelectTrigger>
                  <SelectContent>
                    {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.nama_outlet}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Rencana Kirim</label>
                <Input type="date" {...register("tanggal")} />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center space-y-4">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="text-slate-400" />
              </div>
              <p className="text-muted-foreground">Gunakan Mode Input Cepat untuk mengisi item lebih mudah.</p>
              <Button onClick={() => setIsQuickMode(true)} variant="outline">Buka Katalog Barang</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- RENDER VIEW 2: QUICK INPUT (3-PANEL) ---
  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in duration-300">
      {/* Header Pengunci */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm" onClick={() => setIsQuickMode(false)} className="text-white hover:bg-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden md:block" />
          <div className="flex flex-col">
             <span className="text-[10px] uppercase opacity-60">Outlet</span>
             <span className="font-bold text-sm truncate max-w-[150px]">
               {outlets.find(o => o.id === selectedOutlet)?.nama_outlet || "Belum Pilih"}
             </span>
          </div>
        </div>
        
        <div className="text-center hidden md:block">
          <h2 className="font-bold uppercase tracking-widest text-xs opacity-80">Mode Input Katalog</h2>
        </div>

        <div className="text-right flex flex-col">
          <span className="text-[10px] uppercase opacity-60">Total Estimasi</span>
          <span className="text-lg font-black text-green-400">Rp {totalHarga.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-slate-100">
        {/* PANEL A: Abjad */}
        <div className="w-14 border-r bg-white flex flex-col items-center py-2 overflow-y-auto shrink-0 shadow-sm">
          <Button 
            variant={selectedAlphabet === "" ? "default" : "ghost"} 
            className="mb-2 w-10 h-10 p-0 text-xs font-bold" 
            onClick={() => setSelectedAlphabet("")}
          >ALL</Button>
          {alphabets.map(char => (
            <Button 
              key={char} 
              variant={selectedAlphabet === char ? "default" : "ghost"}
              className="mb-1 w-10 h-10 p-0 text-xs"
              onClick={() => setSelectedAlphabet(char)}
            >
              {char}
            </Button>
          ))}
        </div>

        {/* PANEL B: Item List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 bg-white border-b shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama produk atau kode..." 
                className="pl-10 h-11 rounded-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`relative p-4 rounded-xl border text-left transition-all active:scale-95 shadow-sm
                    ${inCart ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}
                  `}
                >
                  <div className="pr-6">
                    <span className="block font-bold text-slate-800 leading-tight">{product.nama_produk}</span>
                    <span className="text-xs text-indigo-600 font-medium mt-1 block">Rp {product.harga_beli?.toLocaleString('id-ID')}</span>
                  </div>
                  {inCart && (
                    <div className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  {inCart && (
                    <div className="absolute bottom-3 right-3 bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      Qty: {inCart.quantity}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* PANEL C: Keranjang */}
        <div className="w-80 md:w-96 border-l bg-white flex flex-col shadow-xl z-10">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Keranjang Pesanan
            </span>
            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                <LayoutGrid size={48} strokeWidth={1} />
                <p className="text-sm">Belum ada barang dipilih</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-3 border rounded-xl bg-slate-50 border-slate-200 animate-in slide-in-from-right-2 duration-200">
                  <div className="font-bold text-sm text-slate-800 truncate mb-3">{item.nama_produk}</div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-white border rounded-lg p-1 shadow-sm">
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100" onClick={() => updateQty(item.id, -1)}><Minus className="h-4 w-4"/></Button>
                      <span className="w-10 text-center font-black text-slate-700">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100" onClick={() => updateQty(item.id, 1)}><Plus className="h-4 w-4"/></Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.05)] space-y-4">
             <div className="flex justify-between items-end">
                <span className="text-sm text-slate-500 font-medium">Subtotal</span>
                <span className="text-2xl font-black text-slate-900 leading-none">Rp {totalHarga.toLocaleString('id-ID')}</span>
             </div>
             <Button 
               className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700" 
               disabled={cart.length === 0 || !selectedOutlet}
             >
                <Save className="mr-2" /> Simpan Pesanan
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
