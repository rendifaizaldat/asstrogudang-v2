// components/dashboard/AdminChoiceModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminChoiceModal({ userRole }: { userRole: string }) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Hanya tampilkan jika role admin dan belum memilih di sesi ini
    // (Logic sederhana: cek sessionStorage)
    const hasChosen = sessionStorage.getItem("admin_choice_made");
    if (userRole === "admin" && !hasChosen) {
      setShow(true);
    }
  }, [userRole]);

  const handleChoice = (choice: "admin" | "catalog") => {
    // Simpan status agar modal tidak muncul lagi saat refresh
    sessionStorage.setItem("admin_choice_made", "true");
    setShow(false);

    if (choice === "catalog") {
      router.push("/katalog"); // Asumsi nanti ada route katalog
    }
    // Jika admin panel, biarkan di halaman ini (dashboard)
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>

      {/* Modal Content */}
      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up text-center border-white/20 shadow-2xl">
        <div className="mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🛡️
          </div>
          <h2 className="text-2xl font-bold text-white">
            Login Admin Berhasil
          </h2>
          <p className="text-white/70 mt-2">Silakan pilih tujuan Anda:</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleChoice("admin")}
            className="group relative flex items-center justify-between p-4 rounded-xl bg-primary/20 hover:bg-primary/40 border border-primary/30 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🛡️</span>
              <div className="text-left">
                <h3 className="font-bold text-white">Admin Panel</h3>
                <p className="text-xs text-white/60">
                  Kelola stok, user, dan laporan
                </p>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white transition-colors">
              →
            </span>
          </button>

          <button
            onClick={() => handleChoice("catalog")}
            className="group relative flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🛍️</span>
              <div className="text-left">
                <h3 className="font-bold text-white">Katalog Produk</h3>
                <p className="text-xs text-white/60">
                  Mode belanja/kasir outlet
                </p>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white transition-colors">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
