// components/vendor/VendorModal.tsx
"use client";

import { useState, useEffect } from "react";
import { saveVendor } from "@/app/(dashboard)/vendor/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendor?: any;
}

export default function VendorModal({ isOpen, onClose, vendor }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!vendor;

  // Form State
  const [nama, setNama] = useState("");
  const [bank, setBank] = useState("");
  const [rekening, setRekening] = useState("");
  const [atasNama, setAtasNama] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (vendor) {
        setNama(vendor.nama_vendor);
        setBank(vendor.bank || "");
        setRekening(vendor.rekening || "");
        setAtasNama(vendor.atas_nama || "");
      } else {
        setNama("");
        setBank("");
        setRekening("");
        setAtasNama("");
      }
    }
  }, [isOpen, vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (isEdit) formData.append("id", vendor.id);
    formData.append("nama_vendor", nama);
    formData.append("bank", bank);
    formData.append("rekening", rekening);
    formData.append("atas_nama", atasNama);

    const res = await saveVendor(formData);
    setLoading(false);

    if (res.error) {
      alert("Gagal: " + res.error);
    } else {
      alert(res.message);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-800">
            {isEdit ? "Edit Vendor" : "Tambah Vendor Baru"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Nama Vendor <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
              placeholder="Contoh: PT. Sumber Makmur"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-2">
              Informasi Pembayaran
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Bank
                </label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="BCA"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  No. Rekening
                </label>
                <input
                  type="text"
                  value={rekening}
                  onChange={(e) => setRekening(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Atas Nama
              </label>
              <input
                type="text"
                value={atasNama}
                onChange={(e) => setAtasNama(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Rendi Faizal"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Simpan Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
