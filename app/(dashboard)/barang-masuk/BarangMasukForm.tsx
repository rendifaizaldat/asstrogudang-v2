"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ProductCombobox from "@/components/form/ProductCombobox";
import QuickAddProductModal from "@/components/form/QuickAddProductModal";
import { submitBarangMasuk, checkInvoiceExists } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { 
  LayoutGrid, X, Search, ArrowLeft, Minus, Plus, 
  Trash2, Store, Calendar, Save, Music, Youtube
} from "lucide-react";

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

  const [selectedVendor, setSelectedVendor] = useState("");
  const [noNota, setNoNota] = useState("");
  const [tglNota, setTglNota] = useState(new Date().toISOString().split("T")[0]);
  const [tglJatuhTempo, setTglJatuhTempo] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  const comboboxRef = useRef<{ focus: () => void }>(null);
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const cleanNum = (num: number) => Math.round(num * 100) / 100;

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
      } catch (e) { console.error(e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cart, vendor: selectedVendor, noNota, tglNota, tglJatuhTempo
    }));
  }, [cart, selectedVendor, noNota, tglNota, tglJatuhTempo, isLoaded]);

  useEffect(() => {
    const check = async () => {
      if (selectedVendor && noNota) {
        const res = await checkInvoiceExists(selectedVendor, noNota);
        if (res.exists) {
          setInvoiceError("⚠️ Nota ini sudah terdaftar!");
          addToast("Nota duplikat terdeteksi", "error");
        } else {
          setInvoiceError("");
        }
      }
    };
    const timeout = setTimeout(check, 800);
    return () => clearTimeout(timeout);
  }, [selectedVendor, noNota, addToast]);

  const handleUpdateItem = (productId: number, field: 'qty' | 'harga_beli', value: string | number) => {
    let val = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
    if (isNaN(val) || val < 0) val = 0;

    const productRef = products.find(p => p.id === productId);
    if (!productRef) return;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === productId);
      if (existingIdx >= 0) {
        const newCart = [...prev];
        const updatedItem = { ...newCart[existingIdx], [field]: val };
        updatedItem.subtotal = cleanNum(updatedItem.qty * updatedItem.harga_beli);
        if (updatedItem.qty === 0 && field === 'qty') return prev.filter(item => item.id !== productId);
        newCart[existingIdx] = updatedItem;
        return newCart;
      } else {
        const newItem: CartItem = {
          ...productRef,
          qty: field === 'qty' ? val : 1,
          harga_beli: field === 'harga_beli' ? val : (productRef.harga_beli || 0),
          subtotal: 0
        };
        newItem.subtotal = cleanNum(newItem.qty * newItem.harga_beli);
        return [...prev, newItem];
      }
    });
  };

  const handleReset = () => {
    setCart([]); setNoNota(""); setSelectedVendor(""); setTglJatuhTempo("");
    localStorage.removeItem(STORAGE_KEY);
    addToast("Formulir direset", "info");
  };

  const handleSubmit = async () => {
    if (!selectedVendor || !noNota || cart.length === 0) return addToast("Data tidak lengkap!", "error");
    setIsSubmitting(true);
    const res = await submitBarangMasuk({
      vendor: selectedVendor, noNota, tanggalNota: tglNota, tanggalJatuhTempo: tglJatuhTempo, items: cart,
    });
    setIsSubmitting(false);
    if (!res.error) {
      addToast("Barang Masuk Tersimpan!", "success");
      handleReset();
    } else {
      addToast(res.error, "error");
    }
  };

  const grandTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const n = p.nama || "";
      return n.toLowerCase().includes(searchQuery.toLowerCase()) && 
             (selectedAlphabet ? n.toUpperCase().startsWith(selectedAlphabet) : true);
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [searchQuery, selectedAlphabet, products]);

  if (!isLoaded) return <div className="p-10 text-center font-bold">Memuat Draft...</div>;

  return (
    <div className="space-y-6 pb-20 relative">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
           <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Barang Masuk</h2>
           <button 
             onClick={() => setShowMusic(!showMusic)} 
             className={`p-2 rounded-xl transition-all ${showMusic ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
           >
             <Music size={20} />
           </button>
        </div>
        <button onClick={() => setIsQuickMode(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all">
          <LayoutGrid size={18} /> Katalog Barang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><Store size={14}/> Vendor & Invoice</h3>
              <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none">
                 <option value="">-- Pilih Vendor --</option>
                 {vendors.map(v => <option key={v.id} value={v.nama_vendor}>{v.nama_vendor}</option>)}
              </select>
              <input type="text" value={noNota} onChange={(e) => setNoNota(e.target.value)} className={`w-full p-3 border rounded-xl font-bold outline-none ${invoiceError ? 'border-red-500' : ''}`} placeholder="No. Invoice" />
              {invoiceError && <p className="text-[10px] text-red-500 font-bold italic">{invoiceError}</p>}
              <div className="grid grid-cols-2 gap-2">
                 <input type="date" value={tglNota} onChange={(e) => setTglNota(e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" />
                 <input type="date" value={tglJatuhTempo} onChange={(e) => setTglJatuhTempo(e.target.value)} className="w-full p-2 border rounded-lg text-xs font-bold" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold mb-4 text-xs uppercase tracking-widest text-slate-400">Cari Barang</h3>
              <div className="flex gap-2">
                 <div className="flex-1"><ProductCombobox ref={comboboxRef} products={products} onSelect={(p) => handleUpdateItem(p.id, 'qty', 1)} /></div>
                 <button onClick={() => setShowProductModal(true)} className="px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all active:scale-95 shadow-sm">+</button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[550px]">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center rounded-t-2xl text-xs font-black uppercase tracking-widest text-slate-500">
              <span>Rincian Nota ({cart.length} item)</span>
              <span className="text-indigo-600 text-lg tabular-nums tracking-tighter">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left">Produk</th>
                      <th className="px-6 py-4 text-center w-32">Qty</th>
                      <th className="px-6 py-4 text-center w-40">Harga Beli</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4 text-center">#</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800 uppercase text-xs truncate max-w-[150px]">{item.nama}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                             <button onClick={() => handleUpdateItem(item.id, 'qty', cleanNum(item.qty - 1))} className="w-6 h-6 rounded bg-slate-100 text-slate-400 hover:text-red-500"><Minus size={12}/></button>
                             <input type="number" step="0.1" value={item.qty} onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)} className="w-14 text-center font-black text-slate-700 bg-transparent outline-none tabular-nums" />
                             <button onClick={() => handleUpdateItem(item.id, 'qty', cleanNum(item.qty + 1))} className="w-6 h-6 rounded bg-slate-100 text-slate-400 hover:text-green-500"><Plus size={12}/></button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <input type="number" value={item.harga_beli} onChange={(e) => handleUpdateItem(item.id, 'harga_beli', e.target.value)} className="w-full text-center font-bold text-slate-600 bg-slate-50 py-1 rounded outline-none tabular-nums" />
                        </td>
                        <td className="px-6 py-4 text-right font-black">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-center"><button onClick={() => handleUpdateItem(item.id, 'qty', 0)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end rounded-b-2xl">
               <button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all text-xs tracking-tighter uppercase">
                  {isSubmitting ? 'Memproses...' : 'SIMPAN BARANG MASUK'}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* MUSIC PLAYER */}
      {showMusic && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[200] animate-in slide-in-from-right-10">
           <div className="bg-red-600 p-3 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Youtube size={16} /> Mood Booster</div>
              <button onClick={() => setShowMusic(false)} className="hover:bg-red-700 p-1 rounded-full"><X size={16}/></button>
           </div>
           <div className="aspect-video bg-black">
              <iframe width="100%" height="100%" src="https://www.youtube.com/embed/videoseries?list=PL4fGSI1pDJn6jWQSk8D9xU-cyK7p-tA77" title="Music" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
           </div>
           <p className="p-3 text-[10px] text-center font-bold text-slate-400">Kerja Semangat dengan Musik</p>
        </div>
      )}

      {/* KATALOG MODE */}
      {isQuickMode && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white shadow-xl">
            <button onClick={() => setIsQuickMode(false)} className="flex items-center gap-2 font-bold px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"><ArrowLeft/> Kembali</button>
            <div className="text-center flex-1">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Katalog Barang Masuk</p>
               <p className="font-black text-indigo-400 text-lg tabular-nums tracking-tighter">Rp {grandTotal.toLocaleString('id-ID')}</p>
            </div>
            <button onClick={() => setIsQuickMode(false)} className="bg-indigo-600 px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Selesai</button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-16 bg-slate-50 border-r flex flex-col items-center py-4 gap-1 overflow-y-auto shrink-0 shadow-inner">
               <button onClick={() => setSelectedAlphabet("")} className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${selectedAlphabet === "" ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>ALL</button>
               {alphabets.map(c => <button key={c} onClick={() => setSelectedAlphabet(c)} className={`w-11 h-11 rounded-xl text-xs font-bold transition-all ${selectedAlphabet === c ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{c}</button>)}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/30">
               <div className="p-4 bg-white shadow-sm">
                 <input type="text" placeholder="Cari barang..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all uppercase" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
               <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-5 gap-4 content-start pb-20">
                 {filteredProducts.map(p => {
                    const inCart = cart.find(i => i.id === p.id);
                    return (
                      <div key={p.id} className={`p-4 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between h-[13.5rem] shadow-sm ${inCart ? 'border-indigo-600 bg-white scale-[1.02]' : 'border-white bg-white hover:border-slate-200'}`}>
                         <div>
                            <p className="font-black text-slate-800 uppercase text-[10px] leading-tight line-clamp-2 h-7">{p.nama}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2">Hrg Terakhir: Rp {p.harga_beli?.toLocaleString('id-ID') || 0}</p>
                         </div>
                         <div className="mt-auto space-y-2">
                            {inCart ? (
                              <>
                                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 justify-between border border-slate-100">
                                  <button onClick={() => handleUpdateItem(p.id, 'qty', cleanNum(inCart.qty - 1))} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-red-500 shadow-sm"><Minus size={12}/></button>
                                  <input type="number" step="0.1" value={inCart.qty} onChange={(e) => handleUpdateItem(p.id, 'qty', e.target.value)} className="w-10 text-center font-black text-xs bg-transparent outline-none tabular-nums" />
                                  <button onClick={() => handleUpdateItem(p.id, 'qty', cleanNum(inCart.qty + 1))} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-green-500 shadow-sm"><Plus size={12}/></button>
                                </div>
                                <input type="number" value={inCart.harga_beli} onChange={(e) => handleUpdateItem(p.id, 'harga_beli', e.target.value)} className="w-full text-center font-black text-[10px] bg-indigo-50 py-1 rounded-lg border border-indigo-100 outline-none tabular-nums placeholder:normal-case" placeholder="Set Harga" />
                              </>
                            ) : (
                              <button onClick={() => handleUpdateItem(p.id, 'qty', 1)} className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg">+ Tambah</button>
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

      <QuickAddProductModal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        initialName={modalInitialName} 
        onSuccess={(newProduct) => {
          handleUpdateItem(newProduct.id, 'qty', 1);
          addToast(`Barang baru ditambahkan`, "success");
        }}
      />
    </div>
  );
}
