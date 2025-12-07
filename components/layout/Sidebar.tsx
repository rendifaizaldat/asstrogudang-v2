// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowDownCircle,
  RotateCcw,
  Receipt,
  Truck,
  Package,
  Contact,
  Users,
  BarChart3,
  History,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  const isAdmin = user?.role === "admin";

  // Konfigurasi Menu
  const menuGroups = [
    {
      title: "Utama",
      items: [
        // Dashboard hanya untuk Admin
        { name: "Dashboard", href: "/", icon: LayoutDashboard, show: isAdmin },
      ],
    },
    {
      title: "Transaksi",
      items: [
        // User & Admin bisa akses
        {
          name: "Purchase Order",
          href: "/purchase-order",
          icon: ShoppingCart,
          show: true,
        },
        // Hanya Admin
        {
          name: "Barang Masuk",
          href: "/barang-masuk",
          icon: ArrowDownCircle,
          show: isAdmin,
        },
        // User & Admin bisa akses
        { name: "Retur Barang", href: "/retur", icon: RotateCcw, show: true },
      ],
    },
    {
      title: "Keuangan",
      items: [
        // User & Admin bisa akses
        { name: "Piutang Outlet", href: "/piutang", icon: Receipt, show: true },
        // Hanya Admin
        { name: "Hutang Vendor", href: "/hutang", icon: Truck, show: isAdmin },
      ],
    },
    {
      title: "Data Master",
      items: [
        // Master Produk disembunyikan untuk User (Sesuai request "Hanya tampilkan PO, Retur, Piutang")
        // User melihat produk saat melakukan PO saja
        {
          name: "Master Produk",
          href: "/produk",
          icon: Package,
          show: isAdmin,
        },
        {
          name: "Manajemen Vendor",
          href: "/vendor",
          icon: Contact,
          show: isAdmin,
        },
        { name: "Manajemen User", href: "/users", icon: Users, show: isAdmin },
      ],
    },
    {
      title: "Laporan & Sistem",
      items: [
        {
          name: "Analytics",
          href: "/analytics",
          icon: BarChart3,
          show: isAdmin,
        },
        {
          name: "History Arsip",
          href: "/history",
          icon: History,
          show: isAdmin,
        },
        { name: "Settings", href: "/settings", icon: Settings, show: isAdmin },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-50 shadow-2xl border-r border-slate-800 scrollbar-hide">
      {/* Header Aplikasi */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 sticky top-0 bg-slate-900 z-10">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <span className="font-bold text-lg text-white">A</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white leading-none">
            ASSTRO
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1 opacity-70">
            {isAdmin ? "ADMIN PANEL" : "USER PANEL"}
          </p>
        </div>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 px-4 py-6 space-y-8">
        {menuGroups.map((group, idx) => {
          // Filter item yang harus ditampilkan
          const visibleItems = group.items.filter((item) => item.show);

          // Jika satu grup kosong (misal User di grup 'Laporan'), jangan render judul grupnya
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-transform duration-300 ${
                          isActive ? "scale-110" : "group-hover:scale-110"
                        }`}
                      />
                      <span className="font-medium text-sm tracking-wide">
                        {item.name}
                      </span>

                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/30 rounded-l-full blur-[1px]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0">
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50 backdrop-blur-sm">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-slate-800">
              {user?.nama?.charAt(0).toUpperCase() || "U"}
            </div>
            {/* Indikator Online/Offline */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-slate-800 rounded-full flex items-center justify-center ${
                isOnline ? "bg-emerald-500" : "bg-red-500"
              }`}
              title={isOnline ? "Online" : "Offline"}
            >
              {isOnline ? (
                <Wifi size={8} className="text-emerald-950" strokeWidth={4} />
              ) : (
                <WifiOff size={8} className="text-red-950" strokeWidth={4} />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user?.nama || "User"}
            </p>
            <p className="text-[10px] text-slate-400 truncate uppercase">
              {user?.role || "GUEST"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
