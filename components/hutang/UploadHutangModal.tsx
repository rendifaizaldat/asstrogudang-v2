// components/hutang/UploadHutangModal.tsx
"use client";
import { useState } from "react";
import { uploadBuktiHutang } from "@/app/(dashboard)/hutang/actions";

export default function UploadHutangModal({
  isOpen,
  onClose,
  transactionId,
}: any) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", transactionId);

    const res = await uploadBuktiHutang(formData);
    setLoading(false);

    if (res.error) alert(res.error);
    else {
      alert("Bukti pembayaran berhasil diupload!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl animate-fade-in">
        <h3 className="font-bold text-lg mb-4 text-slate-800">
          Upload Bukti Pembayaran
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="text-4xl block mb-2">📷</span>
            <span className="text-sm text-slate-500 font-medium">
              Klik untuk pilih gambar
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold shadow-lg shadow-indigo-500/30"
            >
              {loading ? "Mengupload..." : "Simpan Bukti"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
