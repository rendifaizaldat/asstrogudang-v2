// components/produk/ProductModal.tsx
"use client";

import { useState, useEffect } from "react";
import { addProduct, updateProduct } from "@/app/(dashboard)/produk/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // Jika ada product, berarti mode EDIT
}

export default function ProductModal({ isOpen, onClose, product }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

  // Form State
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [hargaBeli, setHargaBeli] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);
  const [stok, setStok] = useState(0);
  const [foto, setFoto] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setNama(product.nama);
        setKode(product.kode_produk);
        setUnit(product.unit);
        setHargaBeli(product.harga_beli);
        setHargaJual(product.harga_jual);
        setStok(product.sisa_stok);
        setFoto(product.foto || "");
      } else {
        // Reset form for ADD
        setNama("");
        setKode("");
        setUnit("pcs");
        setHargaBeli(0);
        setHargaJual(0);
        setStok(0);
        setFoto("");
      }
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("kode_produk", kode);
    formData.append("unit", unit);
    formData.append("harga_beli", String(hargaBeli));
    formData.append("harga_jual", String(hargaJual));
    formData.append("stok_awal", String(stok));
    formData.append("foto_url", foto);

    let res;
    if (isEdit) {
      res = await updateProduct(product.id, formData);
    } else {
      res = await addProduct(formData);
    }

    setLoading(false);

    if (res.error) {
      alert("Gagal: " + res.error);
    } else {
      alert(isEdit ? "Produk diperbarui!" : "Produk ditambahkan!");
      onClose();
    }
  };

  const autoCalculateJual = (beli: number) => {
    setHargaBeli(beli);
    if (!isEdit && hargaJual === 0) {
      setHargaJual(Math.ceil(beli + beli * 0.05)); // Auto margin 5%
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Nama Produk
            </label>
            <input
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Kode
              </label>
              <input
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="Otomatis"
                className={`w-full border border-slate-200 rounded-lg p-2.5 mt-1 outline-none ${
                  isEdit
                    ? "bg-slate-100 text-slate-500"
                    : "focus:ring-2 focus:ring-indigo-500"
                }`}
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Unit
              </label>
              <input
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                list="units"
                className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="units">
                <option value="pcs" />
                <option value="pack" />
                <option value="kg" />
                <option value="dus" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Harga Beli
              </label>
              <input
                required
                type="number"
                min="0"
                value={hargaBeli}
                onChange={(e) => autoCalculateJual(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Harga Jual
              </label>
              <input
                required
                type="number"
                min="0"
                value={hargaJual}
                onChange={(e) => setHargaJual(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                value={stok}
                onChange={(e) => setStok(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              URL Foto (Opsional)
            </label>
            <input
              type="url"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Buat Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
