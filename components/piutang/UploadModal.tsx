"use client";
import { useState } from "react";
import { uploadBukti } from "@/app/(dashboard)/piutang/actions";

export default function UploadModal({ isOpen, onClose, transactionId }: any) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", transactionId);

    const res = await uploadBukti(formData);
    setLoading(false);

    if (res.error) alert(res.error);
    else {
      alert("Bukti berhasil diupload!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-lg mb-4">Upload Bukti Transfer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="w-full text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Mengupload..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
