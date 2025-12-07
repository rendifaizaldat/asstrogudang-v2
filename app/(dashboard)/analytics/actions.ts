// app/(dashboard)/analytics/actions.ts
"use server";

import { fetchEdgeData } from "@/utils/supabase/api";

const getDateRange = (startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setDate(end.getDate() - 30));

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Update Parameter: Tambah 'outlet'
export async function getAnalyticsData(params: {
  startDate?: string;
  endDate?: string;
  outlet?: string;
}) {
  const { start, end } = getDateRange(params.startDate, params.endDate);

  // Fetch data dari Edge Function (Data mentah semua outlet)
  const { data: analyticsData, error } = await fetchEdgeData(
    "get-analytics-data",
    {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  );

  if (error || !analyticsData) {
    console.error("Gagal ambil data analytics:", error);
    return null;
  }

  const products = analyticsData.products || [];
  let receivables = analyticsData.receivables || []; // Kita akan filter ini

  // --- FILTER OUTLET (Client-side filtering di Server) ---
  if (params.outlet && params.outlet !== "all") {
    const target = params.outlet.toLowerCase();
    receivables = receivables.filter(
      (r: any) => (r.outlet_name || "").toLowerCase() === target
    );
  }

  // Map Produk
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalItemsSold = 0;

  const productPerformance: Record<string, any> = {};
  const dailyStats: Record<string, { revenue: number; profit: number }> = {};

  receivables.forEach((sale: any) => {
    if (sale.status !== "Dibatalkan") {
      const dateKey = new Date(
        sale.tanggal_pengiriman || sale.created_at
      ).toLocaleDateString("id-ID");
      if (!dailyStats[dateKey]) dailyStats[dateKey] = { revenue: 0, profit: 0 };

      const items = sale.transaction_items || [];

      items.forEach((item: any) => {
        const product: any = productMap.get(item.product_id);
        const qty = Number(item.quantity);
        const sellPrice = Number(item.price_per_unit);
        const buyPrice = Number(item.harga_beli || product?.harga_beli || 0);

        const revenue = qty * sellPrice;
        const cogs = qty * buyPrice;
        const profit = revenue - cogs;

        totalRevenue += revenue;
        totalCOGS += cogs;
        totalItemsSold += qty;

        dailyStats[dateKey].revenue += revenue;
        dailyStats[dateKey].profit += profit;

        if (product) {
          if (!productPerformance[product.id]) {
            productPerformance[product.id] = {
              id: product.id,
              name: product.nama,
              qty: 0,
              revenue: 0,
              profit: 0,
            };
          }
          productPerformance[product.id].qty += qty;
          productPerformance[product.id].revenue += revenue;
          productPerformance[product.id].profit += profit;
        }
      });
    }
  });

  const topProducts = Object.values(productPerformance)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const sortedDates = Object.keys(dailyStats).sort((a, b) => {
    const [dA, mA, yA] = a.split("/");
    const [dB, mB, yB] = b.split("/");
    return (
      new Date(`${yA}-${mA}-${dA}`).getTime() -
      new Date(`${yB}-${mB}-${dB}`).getTime()
    );
  });

  const chartData = {
    labels: sortedDates,
    revenue: sortedDates.map((d) => dailyStats[d].revenue),
    profit: sortedDates.map((d) => dailyStats[d].profit),
  };

  return {
    summary: {
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit: totalRevenue - totalCOGS,
      margin:
        totalRevenue > 0
          ? ((totalRevenue - totalCOGS) / totalRevenue) * 100
          : 0,
      itemsSold: totalItemsSold,
      transactionCount: receivables.length,
    },
    topProducts,
    chartData,
    period: {
      start: start.toLocaleDateString("id-ID"),
      end: end.toLocaleDateString("id-ID"),
    },
  };
}
