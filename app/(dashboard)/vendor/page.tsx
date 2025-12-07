// app/(dashboard)/vendor/page.tsx
import { getVendors } from "./actions";
import VendorList from "@/components/vendor/VendorList";
import VendorHeader from "@/components/vendor/VendorHeader";

export const dynamic = "force-dynamic";

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Fetch Data
  const vendors = await getVendors(search);

  return (
    <div className="space-y-6">
      <VendorHeader total={vendors.length} />

      {/* Search Bar Sederhana */}
      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Cari nama vendor, bank, atau rekening..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-700"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
        >
          Cari
        </button>
      </form>

      <VendorList vendors={vendors} />
    </div>
  );
}
