// components/users/UserHeader.tsx
"use client";
import { useState } from "react";
import UserModal from "./UserModal";

export default function UserHeader({ total }: { total: number }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Manajemen Pengguna
        </h2>
        <p className="text-slate-500 text-sm">
          Total {total} akun aktif dalam sistem.
        </p>
      </div>
      <button
        onClick={() => setShowAdd(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
      >
        <span className="text-xl">+</span> Tambah User
      </button>

      <UserModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
