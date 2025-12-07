// components/layout/Header.tsx
"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Prioritaskan Nama, fallback ke Email
  const displayName = user?.nama || user?.email || "User";
  const displayRole = user?.role || "Pengguna";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm/50">
      <button className="lg:hidden text-slate-500 hover:text-indigo-600">
        <span className="text-2xl">☰</span>
      </button>

      <div className="hidden lg:block text-slate-500 text-sm font-medium">
        {new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-slate-800 font-bold">{displayName}</p>
          <p className="text-xs text-slate-500 capitalize">
            {displayRole} {user?.outlet ? `(${user.outlet})` : ""}
          </p>
        </div>

        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
          <span className="font-bold text-sm">{initial}</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium ml-2"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
