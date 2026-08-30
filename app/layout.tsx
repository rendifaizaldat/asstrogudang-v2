'use client';
import { useEffect, useState } from 'react';
import './globals.css'; // Pastikan CSS global tetap dipanggil

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState(new Date('2026-09-01T00:00:00').getTime() - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = new Date('2026-09-01T00:00:00').getTime() - new Date().getTime();
      setTimeLeft(remaining);
      
      // Jika waktu hitungan mundur sudah habis, otomatis arahkan ke domain baru
      if (remaining <= 0) {
        window.location.href = 'https://alma-app.vercel.app';
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <html lang="id">
      <body>
        {/* KITA TIDAK MERENDER {children} DI SINI */}
        {/* Hal ini yang membuat halaman login, dashboard, dll tidak bisa diakses */}
        <main className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-50">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Asstro Gudang saat ini sedang proses pembaharuan
          </h1>
          <p className="mb-6 text-gray-600 max-w-md">
            Kami sedang melakukan mutasi database. Aplikasi lama ini telah ditutup dan akan dialihkan ke domain baru <strong>alma-app.vercel.app</strong>.
          </p>
          
          <div className="text-4xl font-mono mb-8 font-bold text-blue-600">
            {timeLeft > 0 ? (
              <span>{days} Hari : {hours} Jam : {minutes} Menit : {seconds} Detik</span>
            ) : (
              <span>Mengalihkan ke domain baru...</span>
            )}
          </div>

          <a 
            href="https://alma-app.vercel.app" 
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Kunjungi Alma Sekarang
          </a>
        </main>
      </body>
    </html>
  );
}
