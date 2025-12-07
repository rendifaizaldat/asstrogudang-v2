// components/vendor/VendorList.tsx
"use client";

import { useState } from "react";
import { deleteVendor } from "@/app/(dashboard)/vendor/actions";
import VendorModal from "./VendorModal";

export default function VendorList({ vendors }: { vendors: any[] }) {
  const [editData, setEditData] = useState<any>(null);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `HAPUS VENDOR?\n\nTindakan ini akan menghapus data vendor "${name}".\nPastikan vendor ini tidak memiliki riwayat hutang.`
      )
    )
      return;

    const res = await deleteVendor(id, name);
    if (res.error) alert(res.error);
    else alert("Vendor berhasil dihapus.");
  };

  return (
    <>
      <VendorModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        vendor={editData}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nama Vendor</th>
                <th className="px-6 py-4">Bank</th>
                <th className="px-6 py-4">No. Rekening</th>
                <th className="px-6 py-4">Atas Nama</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Tidak ada data vendor.
                  </td>
                </tr>
              ) : (
                vendors.map((v: any) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 text-base">
                      {v.nama_vendor}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {v.bank || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">
                      {v.rekening || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {v.atas_nama || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditData(v)}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Vendor"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.nama_vendor)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Vendor"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
