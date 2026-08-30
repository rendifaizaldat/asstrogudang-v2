import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Izinkan akses jika pengguna sudah berada di halaman utama (root '/')
  if (url.pathname === '/') {
    return NextResponse.next();
  }

  // Abaikan request untuk file statis Next.js (CSS, gambar, ikon)
  if (url.pathname.startsWith('/_next') || url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Jika pengguna mencoba mengakses rute lain (seperti /login, /produk, /api/*, dll),
  // langsung tendang mereka kembali ke halaman utama ('/')
  url.pathname = '/';
  return NextResponse.redirect(url);
}

// Tentukan rute mana saja yang akan dicegat oleh middleware
export const config = {
  matcher: [
    /*
     * Cegat semua rute request, kecuali untuk:
     * - api (rute API jika ingin dibiarkan, tapi dalam kasus ini kita cegat juga)
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (ikon browser)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
