// components/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { updateSettings } from "@/app/(dashboard)/settings/actions";
import Image from "next/image";

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);

  // Preview State
  const [logoPreview, setLogoPreview] = useState(
    initialData?.company_logo_url || ""
  );
  const [sigPreview, setSigPreview] = useState(
    initialData?.signature_url || ""
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: any
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirm("Simpan perubahan pengaturan?")) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await updateSettings(formData);
    setLoading(false);

    if (res.error) alert("Gagal: " + res.error);
    else {
      alert("Berhasil disimpan!");
      window.location.reload(); // Reload agar logo di Sidebar terupdate
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. IDENTITAS APLIKASI */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          Identitas Perusahaan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">
                Nama Aplikasi / Perusahaan
              </label>
              <input
                name="company_name"
                defaultValue={initialData?.company_name}
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">
                Versi Aplikasi (Otomatis)
              </label>
              <input
                disabled
                value={initialData?.app_version || "v2.0 Enterprise"}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">
                Alamat / Kontak (Untuk Header Laporan)
              </label>
              <textarea
                name="company_address"
                defaultValue={initialData?.company_address}
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <label className="block text-sm font-bold text-slate-600 mb-3">
              Logo Aplikasi
            </label>
            <div className="relative w-32 h-32 mb-4 bg-white rounded-full shadow-sm overflow-hidden flex items-center justify-center border">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <span className="text-4xl">🏢</span>
              )}
            </div>
            <input
              type="file"
              name="logo_file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setLogoPreview)}
              className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-slate-400 mt-2">
              Disarankan rasio 1:1 (Persegi)
            </p>
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN LAPORAN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          Pengaturan Laporan (PDF)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">
              Nama Penanda Tangan
            </label>
            <input
              name="signer_name"
              defaultValue={initialData?.signer_name}
              placeholder="Ex: Rendi Faizal Dat"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-bold text-slate-600 mb-2">
              Scan Tanda Tangan
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-40 h-20 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                {sigPreview ? (
                  <Image
                    src={sigPreview}
                    alt="Signature"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <span className="text-slate-300 text-xs">Belum ada TTD</span>
                )}
              </div>
              <input
                type="file"
                name="signature_file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setSigPreview)}
                className="text-sm text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all transform hover:-translate-y-1"
        >
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
