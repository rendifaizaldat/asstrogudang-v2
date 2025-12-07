// components/users/UserModal.tsx
"use client";

import { useState, useEffect } from "react";
import { saveUser } from "@/app/(dashboard)/users/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export default function UserModal({ isOpen, onClose, user }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!user;

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [outlet, setOutlet] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setNama(user.nama);
        setEmail(user.email);
        setPassword(""); // Password dikosongkan saat edit (opsional diisi)
        setOutlet(user.outlet || "");
        setRole(user.role);
      } else {
        setNama("");
        setEmail("");
        setPassword("");
        setOutlet("");
        setRole("user");
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Sederhana
    if (!isEdit && !password)
      return alert("Password wajib diisi untuk pengguna baru.");
    if (password && password.length < 6)
      return alert("Password minimal 6 karakter.");

    setLoading(true);

    const formData = new FormData();
    if (isEdit) formData.append("id", user.id);
    formData.append("nama", nama);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("outlet", outlet);
    formData.append("role", role);

    const res = await saveUser(formData);
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
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}
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
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Nama Lengkap
            </label>
            <input
              required
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Contoh: Outlet Lembang"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
              className={`w-full border border-slate-200 rounded-lg p-2.5 outline-none ${
                isEdit
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "focus:ring-2 focus:ring-indigo-500"
              }`}
              placeholder="email@contoh.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Password{" "}
              {isEdit && (
                <span className="text-slate-400 font-normal normal-case">
                  (Biarkan kosong jika tidak diubah)
                </span>
              )}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                Nama Outlet
              </label>
              <input
                required
                type="text"
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Lembang"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="user">User / Outlet</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
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
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
