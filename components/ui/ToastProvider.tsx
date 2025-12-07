// components/ui/ToastProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Otomatis hilang setelah 1.5 detik (sedikit lebih lama dari 1s agar sempat terbaca)
      // User minta 1 detik, bisa disesuaikan di sini (1000)
      setTimeout(() => {
        removeToast(id);
      }, 2000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Container Toast */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-sm
              animate-slide-in-right transition-all
              ${
                toast.type === "success"
                  ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                  : toast.type === "error"
                  ? "bg-red-50/90 border-red-200 text-red-800"
                  : "bg-blue-50/90 border-blue-200 text-blue-800"
              }
            `}
          >
            {/* Icon */}
            <div className="shrink-0">
              {toast.type === "success" && <CheckCircle size={20} />}
              {toast.type === "error" && <AlertCircle size={20} />}
              {toast.type === "info" && <Info size={20} />}
            </div>

            {/* Message */}
            <p className="text-sm font-medium flex-1">{toast.message}</p>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
