"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Search, Plus, Minus, Trash2, Keyboard, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";

// Interface untuk mempermudah mapping
interface Product {
  id: string;
  nama_produk: string;
  harga_beli?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PurchaseOrderForm({ outlets, initialProducts }: { outlets: any[], initialProducts: Product[] }) {
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // React Hook Form untuk Header
  const { register, watch, setValue } = useForm({
    defaultValues: {
      outlet_id: "",
      tanggal: new Date().toISOString().split('T')[0],
    }
  });

  const selectedOutlet = watch("outlet_id");
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Logic: Filter Produk berdasarkan Search & Abjad
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAlphabet = selectedAlphabet ? p.nama_produk.toUpperCase().startsWith(selectedAlphabet) : true;
      return matchesSearch && matchesAlphabet;
    }).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
  }, [searchQuery, selectedAlphabet, initialProducts]);

  // Logic: Keranjang (Panel C)
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

  // VIEW 1: Original Form (Sederhana untuk PC)
  if (!isQuickMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Purchase Order</h1>
          <Button onClick={() => setIsQuickMode(true)} variant="outline" className="gap-2">
            <LayoutGrid className="w-4 h-4" /> Input Cepat (Tablet Mode)
          </Button>
        </div>
        {/* Render Form Original Anda di sini */}
        <Card>
           <CardContent className="p-6">
              <p className="text-muted-foreground text-center">Silahkan gunakan mode input biasa atau pindah ke Mode Cepat.</p>
           </CardContent>
        </Card>
      </div>
    );
  }

  // VIEW 2: QUICK INPUT MODE (3-PANEL)
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header Pengunci Data */}
      <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
        <div className="flex gap-4 items-center">
          <Button variant="secondary" size="sm" onClick={() => setIsQuickMode(false)}>Kembali</Button>
          <div className="flex flex-col">
             <span className="text-xs opacity-70">Outlet Tujuan</span>
             <select 
               className="bg-transparent font-bold outline-none"
               value={selectedOutlet}
               onChange={(e) => setValue("outlet_id", e.target.value)}
             >
               <option value="" className="text-black">-- Pilih Outlet --</option>
               {outlets.map(o => <option key={o.id} value={o.id} className="text-black">{o.nama_outlet}</option>)}
             </select>
          </div>
        </div>
        <div className="font-bold">Mode Input Cepat</div>
        <div className="text-right">
          <span className="text-xs block opacity-70">Total Pesanan</span>
          <span className="text-xl font-bold">Rp {totalHarga.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL A: Alphabet Filter */}
        <div className="w-12 border-r bg-muted flex flex-col items-center py-2 overflow-y-auto no-scrollbar">
          <Button 
            variant={selectedAlphabet === "" ? "default" : "ghost"} 
            size="sm" className="mb-1 w-10" 
            onClick={() => setSelectedAlphabet("")}
          >All</Button>
          {alphabets.map(char => (
            <Button 
              key={char} 
              variant={selectedAlphabet === char ? "default" : "ghost"}
              size="sm" 
              className="mb-1 w-10"
              onClick={() => setSelectedAlphabet(char)}
            >
              {char}
            </Button>
          ))}
        </div>

        {/* PANEL B: Item List */}
        <div className="flex-1 flex flex-col bg-slate-50">
          <div className="p-2 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama produk..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-2 content-start">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-3 rounded-lg border bg-white cursor-pointer active:scale-95 transition-all flex justify-between items-center ${inCart ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{product.nama_produk}</span>
                    <span className="text-xs text-muted-foreground">Rp {product.harga_beli?.toLocaleString('id-ID')}</span>
                  </div>
                  {inCart && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* PANEL C: Keranjang (Right Side) */}
        <div className="w-80 border-l bg-white flex flex-col">
          <div className="p-3 border-b font-bold flex justify-between bg-slate-100">
            <span>Item Dipilih</span>
            <span className="bg-primary text-white px-2 rounded-full text-xs flex items-center">{cart.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">Keranjang kosong</div>
            )}
            {cart.map(item => (
              <div key={item.id} className="p-2 border rounded-md text-sm">
                <div className="font-medium truncate mb-2">{item.nama_produk}</div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3"/></Button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3"/></Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-3 w-3"/></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-slate-50 space-y-3">
             <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
             </div>
             <Button className="w-full h-12 text-lg" disabled={cart.length === 0 || !selectedOutlet}>
                Simpan Pesanan
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
