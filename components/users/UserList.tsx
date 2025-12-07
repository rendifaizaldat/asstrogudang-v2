// components/users/UserList.tsx
"use client";

import { useState } from "react";
import { deleteUser } from "@/app/(dashboard)/users/actions";
import UserModal from "./UserModal";

export default function UserList({ users }: { users: any[] }) {
  const [editData, setEditData] = useState<any>(null);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `HAPUS PENGGUNA?\n\nTindakan ini akan menghapus akses login untuk "${name}". Lanjutkan?`
      )
    )
      return;

    const res = await deleteUser(id);
    if (res.error) alert(res.error);
  };

  return (
    <>
      <UserModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        user={editData}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Outlet</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Tidak ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {u.nama}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                        {u.outlet || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditData(u)}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.nama)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus User"
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
