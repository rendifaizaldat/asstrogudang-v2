// app/(dashboard)/hutang/page.tsx
import { getHutangData } from "./actions";
import HutangList from "@/components/hutang/HutangList";
import HutangToolbar from "@/components/hutang/HutangToolbar";

export const dynamic = "force-dynamic";

export default async function HutangPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;

  // 1. Ambil Data (Server-side fetch dengan Filter)
  const hutangData = await getHutangData({
    startDate: params.startDate,
    endDate: params.endDate,
    search: params.search,
    status: params.status, // Teruskan status ke actions
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Hutang Vendor</h2>
        <p className="text-slate-500 text-sm">
          Monitor kewajiban pembayaran kepada supplier dan status pelunasan.
        </p>
      </div>

      {/* TOOLBAR */}
      <HutangToolbar data={hutangData} />

      {/* LIST DATA */}
      <HutangList data={hutangData} />
    </div>
  );
}
