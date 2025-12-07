// components/dashboard/DashboardChart.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Registrasi komponen Chart.js wajib dilakukan
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  piutang: number;
  hutang: number;
}

export default function DashboardChart({ piutang, hutang }: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(0, 0, 0, 0.7)", // Warna teks legend putih
          font: {
            family: "Inter",
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ff88",
        bodyColor: "#ff88",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0, 255, 255, 0.1)", // Grid tipis transparan
        },
        ticks: {
          color: "rgba(0 ,0, 0, 0.6)",
        },
      },
      y: {
        grid: {
          color: "rgba(0, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
          callback: function (value: any) {
            // Persingkat angka besar (Jt/M)
            if (value >= 1000000000)
              return (value / 1000000000).toFixed(1) + "M";
            if (value >= 1000000) return (value / 1000000).toFixed(0) + "jt";
            if (value >= 1000) return (value / 1000).toFixed(0) + "rb";
            return value;
          },
        },
      },
    },
  };

  const data = {
    labels: ["Keuangan Saat Ini"],
    datasets: [
      {
        label: "Piutang (Pemasukan Tertunda)",
        data: [piutang],
        backgroundColor: "rgba(234, 179, 8, 0.8)", // Yellow-500
        borderColor: "rgba(234, 179, 8, 1)",
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 60,
      },
      {
        label: "Hutang (Kewajiban)",
        data: [hutang],
        backgroundColor: "rgba(168, 85, 247, 0.8)", // Purple-500
        borderColor: "rgba(168, 85, 247, 1)",
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 60,
      },
    ],
  };

  return <Bar options={options} data={data} />;
}
