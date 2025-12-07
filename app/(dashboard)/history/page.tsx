// app/(dashboard)/history/page.tsx
import { getArchivedData } from "./actions";
import ArchiveList from "@/components/history/ArchiveList";
import ArchiveSearch from "@/components/history/ArchiveSearch"; // Import Baru

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Fetch Data (Server-side) dengan parameter search
  const { payables, receivables } = await getArchivedData(search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Arsip Transaksi</h2>
          <p className="text-slate-500 text-sm">
            Data yang dihapus akan tersimpan di sini dan dapat dipulihkan
            kembali.
          </p>
        </div>

        {/* Kolom Search */}
        <div className="w-full md:w-96">
          <ArchiveSearch />
        </div>
      </div>

      <ArchiveList payables={payables} receivables={receivables} />
    </div>
  );
}
