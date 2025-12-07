// app/login/page.tsx
"use client";

import { useActionState } from "react";
import { login } from "./actions";

// Definisi state awal untuk form hook
const initialState = {
  error: "",
};

export default function LoginPage() {
  // Menggunakan React Hook terbaru untuk handle form action
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData);
      if (result?.error) {
        return { error: result.error };
      }
      return { error: "" };
    },
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <div className="glass-card w-full max-w-md p-8 animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <span className="text-4xl">🏭</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login Outlet</h1>
          <p className="text-white/70 text-sm">Gudang Bandung Raya v2</p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Email atau Nama Outlet
            </label>
            <input
              name="identity"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="contoh@email.com atau Nama Outlet"
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-100 text-sm text-center animate-fade-in">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              "Masuk Sistem"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/50 text-xs">
            &copy; 2025 Warehouse Management System
          </p>
        </div>
      </div>
    </div>
  );
}
