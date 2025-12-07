// components/system/LegacyCleanup.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCleanup() {
  const router = useRouter();

  useEffect(() => {
    const cleanUpLegacyData = async () => {
      // 1. Cek apakah ada tanda-tanda aplikasi lama
      const legacyUser = localStorage.getItem("warehouse_app_user");
      const legacyCart = localStorage.getItem("warehouse_app_cart");

      // Jika ada data legacy, kita lakukan pembersihan total
      if (legacyUser || legacyCart) {
        console.warn("Legacy app detected. Initiating cleanup protocol...");

        // A. Hapus semua LocalStorage (Data lama vs Data baru beda struktur)
        localStorage.clear();
        sessionStorage.clear();

        // B. Hapus Service Worker Lama (PENTING AGAR TIDAK LOAD FILE LAMA)
        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log("Legacy Service Worker unregistered");
          }
        }

        // C. Hapus Cache Storage Lama (gudang-bandung-raya-cache-v3.0)
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => {
              console.log(`Deleting legacy cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
          );
        }

        // D. Hapus Cookies Lama (Opsional, untuk memastikan bersih)
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });

        // E. Force Reload ke Login Page Baru
        // Gunakan window.location untuk hard refresh, bukan router.push
        window.location.href = "/login?migrated=true";
      }
    };

    cleanUpLegacyData();
  }, []);

  return null; // Komponen ini tidak merender visual apa-apa
}
