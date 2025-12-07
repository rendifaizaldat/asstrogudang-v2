// components/analytics/AnalyticsSummary.tsx
"use client";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

export default function AnalyticsSummary({ summary }: any) {
  const cards = [
    {
      label: "Total Omzet",
      value: formatRupiah(summary.revenue),
      sub: `${summary.transactionCount} Transaksi`,
      color: "bg-indigo-50 text-indigo-600",
      icon: "💰",
    },
    {
      label: "Estimasi HPP (Modal)",
      value: formatRupiah(summary.cogs),
      sub: "Berdasarkan Harga Beli",
      color: "bg-slate-100 text-slate-600",
      icon: "📦",
    },
    {
      label: "Profit Kotor",
      value: formatRupiah(summary.grossProfit),
      sub: "Omzet - HPP",
      color: "bg-emerald-50 text-emerald-600",
      icon: "📈",
    },
    {
      label: "Margin Keuntungan",
      value: `${summary.margin.toFixed(1)}%`,
      sub: "Persentase Profit",
      color: "bg-amber-50 text-amber-600",
      icon: "⚡",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${card.color}`}
            >
              {card.icon}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {card.value}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {card.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
