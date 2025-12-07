// components/dashboard/ExportButton.tsx
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definisikan tipe data agar TypeScript tidak komplain
interface Transaction {
  id: string;
  date: string;
  subject: string; // Nama Outlet / Vendor
  amount: number;
  type: string;
  status: string;
}

export default function ExportButton({
  data,
  period,
}: {
  data: Transaction[];
  period: string;
}) {
  const handleExport = () => {
    const doc = new jsPDF();

    // Header Laporan
    doc.setFontSize(18);
    doc.text(`Laporan Keuangan - ${period}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 30);

    // Siapkan Data Tabel
    const tableRows = data.map((t) => [
      new Date(t.date).toLocaleDateString("id-ID"),
      t.id,
      t.type,
      t.subject,
      t.status,
      // Format Rupiah manual untuk PDF
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(t.amount),
    ]);

    // Buat Tabel
    autoTable(doc, {
      head: [["Tanggal", "No. Ref", "Tipe", "Subjek", "Status", "Nominal"]],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] }, // Warna Primary (Indigo)
    });

    // Hitung Total
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text(
      `Total Transaksi: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(total)}`,
      14,
      finalY
    );

    // Download
    doc.save(`Laporan_Keuangan_${period.replace(/\s/g, "_")}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
    >
      <span>📥</span> Export PDF
    </button>
  );
}
