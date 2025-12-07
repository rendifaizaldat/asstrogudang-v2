// app/(dashboard)/analytics/page.tsx
import { getAnalyticsData } from "./actions";
import AnalyticsSummary from "@/components/analytics/AnalyticsSummary";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import AnalyticsToolbar from "@/components/analytics/AnalyticsToolbar";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;

  // Fetch Data Server Side
  const data = await getAnalyticsData({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (!data) {
    return (
      <div className="p-10 text-center text-slate-500">
        Gagal memuat data analytics. Silakan coba lagi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">
          Business Analytics
        </h2>
        <p className="text-slate-500 text-sm">
          Analisis performa keuangan, keuntungan, dan tren penjualan.
        </p>
      </div>

      {/* FILTER & EXPORT */}
      <AnalyticsToolbar data={data} />

      {/* SUMMARY CARDS */}
      <AnalyticsSummary summary={data.summary} />

      {/* CHARTS */}
      <AnalyticsCharts
        chartData={data.chartData}
        topProducts={data.topProducts}
      />

      {/* DISCLAIMER */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
        <strong>Catatan:</strong> Perhitungan profit di atas adalah estimasi
        (Gross Profit) berdasarkan:
        <em>(Harga Jual Transaksi - Harga Beli Master Produk saat ini)</em>.
        Biaya operasional lain (gaji, listrik, sewa) belum termasuk.
      </div>
    </div>
  );
}
