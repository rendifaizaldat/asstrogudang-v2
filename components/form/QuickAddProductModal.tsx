"use client";

import { useState, useEffect } from "react";
import { quickAddProduct } from "@/app/(dashboard)/barang-masuk/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
  initialName?: string;
}

export default function QuickAddProductModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = "",
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    unit: "pcs",
    harga_beli: 0,
    harga_jual: 0,
  });

  // EFFECT: Sinkronisasi nama awal saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        nama: initialName || "",
        kode: "",
        harga_beli: 0,
        harga_jual: 0,
      }));
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  // LOGIC: Hitung margin otomatis 5% saat harga beli berubah
  const handleHargaBeliChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const beli = value === "" ? 0 : Number(value);

    // Hitung margin 5% (dibulatkan ke atas agar aman)
    const margin = beli * 0.05;
    const jual = Math.ceil(beli + margin);

    setFormData((prev) => ({
      ...prev,
      harga_beli: beli,
      harga_jual: jual,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await quickAddProduct(formData);
    setIsSubmitting(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert("Produk berhasil ditambahkan!");
      onSuccess(res.product); // Kirim data produk baru ke parent
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl relative z-10 animate-slide-up">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            ✨ Tambah Produk Baru
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Nama Produk
            </label>
            <input
              required
              type="text"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
              placeholder="Contoh: Bawang Merah Super"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Kode (Opsional)
              </label>
              <input
                type="text"
                placeholder="Otomatis"
                value={formData.kode}
                onChange={(e) =>
                  setFormData({ ...formData, kode: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Unit
              </label>
              <input
                required
                type="text"
                list="units"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="units">
                <option value="pcs" />
                <option value="pack" />
                <option value="kg" />
                <option value="liter" />
                <option value="roll" />
                <option value="jrc" />
                <option value="ikat" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Harga Beli
              </label>
              <input
                required
                type="number"
                min="0"
                value={formData.harga_beli || ""}
                onChange={handleHargaBeliChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Harga Jual{" "}
                <span className="text-emerald-600 text-[10px]">(+5%)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.harga_jual || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    harga_jual: Number(e.target.value),
                  })
                }
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
