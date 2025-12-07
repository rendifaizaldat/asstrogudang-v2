// components/form/ProductCombobox.tsx
"use client";

import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

interface Product {
  id: number;
  nama: string;
  kode_produk: string;
  unit: string;
  sisa_stok: number;
  harga_jual: number;
}

interface Props {
  products: Product[];
  onSelect: (product: Product) => void;
  disabled?: boolean;
}

// Gunakan forwardRef agar parent bisa memanggil method focus() komponen ini
const ProductCombobox = forwardRef<{ focus: () => void }, Props>(
  ({ products, onSelect, disabled }, ref) => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1); // Untuk navigasi keyboard

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Expose fungsi focus ke parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Filter produk
    useEffect(() => {
      if (query.length < 2) {
        setFiltered([]);
        setIsOpen(false);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const result = products
        .filter(
          (p) =>
            p.nama.toLowerCase().includes(lowerQuery) ||
            (p.kode_produk && p.kode_produk.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 10);

      setFiltered(result);
      setIsOpen(true);
      setActiveIndex(0); // Reset pilihan ke item pertama
    }, [query, products]);

    // Handle Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        // Scroll otomatis ke item yang aktif
        scrollActiveIntoView(activeIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        scrollActiveIntoView(activeIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          handleSelect(filtered[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const scrollActiveIntoView = (index: number) => {
      if (listRef.current) {
        const item = listRef.current.children[index] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: "nearest" });
        }
      }
    };

    const handleSelect = (product: Product) => {
      onSelect(product);
      setQuery("");
      setIsOpen(false);
      setActiveIndex(-1);
    };

    // Close click outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik nama produk (Ctrl+K)..."
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 text-slate-800"
            autoComplete="off"
          />
          <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>

          {/* Indikator Shortcut */}
          {!query && (
            <span className="absolute right-3 top-3.5 text-xs text-slate-400 border border-slate-200 px-1.5 rounded bg-slate-50">
              Ctrl K
            </span>
          )}
        </div>

        {isOpen && filtered.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in"
          >
            {filtered.map((product, idx) => (
              <li
                key={product.id}
                onClick={() => handleSelect(product)}
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 last:border-none transition-colors ${
                  idx === activeIndex ? "bg-primary/10" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className={`font-medium ${
                        idx === activeIndex ? "text-primary" : "text-slate-800"
                      }`}
                    >
                      {product.nama}
                    </p>
                    <p className="text-xs text-slate-500">
                      Kode: {product.kode_produk || "-"} | Unit: {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-700">
                      Rp {product.harga_jual.toLocaleString("id-ID")}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        product.sisa_stok > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      Stok: {product.sisa_stok}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

ProductCombobox.displayName = "ProductCombobox";
export default ProductCombobox;
