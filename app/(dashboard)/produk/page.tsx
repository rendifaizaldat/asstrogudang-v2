// app/(dashboard)/produk/page.tsx
import { getProducts } from "./actions";
import ProductList from "@/components/produk/ProductList";
import ProductHeader from "@/components/produk/ProductHeader";
import ProductSearch from "@/components/produk/ProductSearch"; // <-- Import Baru

export const dynamic = "force-dynamic";

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  // Fetch Data
  const { products, total } = await getProducts(page, 20, search);

  return (
    <div className="space-y-6">
      <ProductHeader total={total} />

      {/* SEARCH SECTION (Baru) */}
      <div className="flex gap-2">
        <ProductSearch />
      </div>

      {/* TABLE SECTION */}
      <ProductList products={products} search={search} />

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-4">
        {page > 1 && (
          <a
            href={`?page=${page - 1}&search=${search}`}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            &laquo; Sebelumnya
          </a>
        )}

        <span className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100">
          Halaman {page}
        </span>

        {/* Logic sederhana: jika produk yang diambil = limit (20), asumsi masih ada halaman berikutnya */}
        {products.length === 20 && (
          <a
            href={`?page=${page + 1}&search=${search}`}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Selanjutnya &raquo;
          </a>
        )}
      </div>
    </div>
  );
}
