// components/analytics/AnalyticsCharts.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsCharts({ chartData, topProducts }: any) {
  // 1. Grafik Revenue vs Profit (Line Chart)
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Tren Pendapatan & Keuntungan" },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: { grid: { display: false } },
    },
  };

  const lineData = {
    labels: chartData.labels,
    datasets: [
      {
        fill: true,
        label: "Omzet (Revenue)",
        data: chartData.revenue,
        borderColor: "rgb(99, 102, 241)", // Indigo
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.3,
      },
      {
        fill: true,
        label: "Profit (Kotor)",
        data: chartData.profit,
        borderColor: "rgb(16, 185, 129)", // Emerald
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.3,
      },
    ],
  };

  // 2. Grafik Top Produk (Bar Chart)
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Top 10 Produk Terlaris (Qty)" },
    },
    indexAxis: "y" as const, // Horizontal Bar
  };

  const barData = {
    labels: topProducts.map((p: any) => p.name),
    datasets: [
      {
        label: "Terjual (Unit)",
        data: topProducts.map((p: any) => p.qty),
        backgroundColor: "rgba(245, 158, 11, 0.8)", // Amber
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px]">
        <Line options={lineOptions} data={lineData} />
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px]">
        <Bar options={barOptions} data={barData} />
      </div>
    </div>
  );
}
