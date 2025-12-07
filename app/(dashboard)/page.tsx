// app/(dashboard)/page.tsx
import { createClient } from "@/utils/supabase/server";
import { fetchEdgeData } from "@/utils/supabase/api";
import AdminChoiceModal from "@/components/dashboard/AdminChoiceModal";
import DashboardFilter from "@/components/dashboard/DashboardFilter";
import ExportButton from "@/components/dashboard/ExportButton";
import DashboardChart from "@/components/dashboard/DashboardChart";

// --- Helpers ---
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const parseAmount = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (typeof value === "string") {
    const clean = value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(clean) || 0;
  }
  return 0;
};

const timeAgo = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hr lalu`;
};

// --- Logic Filter ---
function isDateInPeriod(
  dateStr: string,
  params: { [key: string]: string | string[] | undefined }
) {
  const date = new Date(dateStr);
  const mode = params.mode || "monthly";

  if (mode === "daily") {
    const target = params.date ? new Date(params.date as string) : new Date();
    return (
      date.getDate() === target.getDate() &&
      date.getMonth() === target.getMonth() &&
      date.getFullYear() === target.getFullYear()
    );
  }
  if (mode === "monthly") {
    const month = params.month
      ? Number(params.month)
      : new Date().getMonth() + 1;
    const year = params.year ? Number(params.year) : new Date().getFullYear();
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  }
  if (mode === "yearly") {
    const year = params.year ? Number(params.year) : new Date().getFullYear();
    return date.getFullYear() === year;
  }
  return true;
}

// --- Data Fetching ---
async function getDashboardData(searchParams: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id)
    .single();

  const role = userProfile?.role || "user";
  const functionName = role === "admin" ? "get-admin-data" : "get-user-data";
  const { data: apiData } = await fetchEdgeData(functionName);

  if (!apiData)
    return {
      role,
      stats: null,
      activities: [],
      exportData: [],
      periodLabel: "",
    };

  const products = apiData.products || apiData.inventaris || [];
  const receivables = apiData.receivables || apiData.piutang || [];
  const payables = apiData.payables || apiData.hutang || [];

  const filteredReceivables = receivables.filter((r: any) =>
    isDateInPeriod(r.created_at || r.tanggal_pengiriman, searchParams)
  );
  const filteredPayables = payables.filter((p: any) =>
    isDateInPeriod(p.created_at || p.tanggal_nota, searchParams)
  );

  const totalProduk = products.length;
  const stokHabis = products.filter(
    (p: any) => Number(p.sisa_stok) <= 0
  ).length;

  const totalPiutang = filteredReceivables
    .filter((r: any) => (r.status || "").toLowerCase() !== "lunas")
    .reduce((sum: number, r: any) => sum + parseAmount(r.total_tagihan), 0);

  const totalHutang = filteredPayables
    .filter((p: any) => (p.status || "").toLowerCase() !== "lunas")
    .reduce((sum: number, p: any) => sum + parseAmount(p.total_tagihan), 0);

  const totalTransaksi = filteredReceivables.length + filteredPayables.length;

  const allTransactions = [
    ...filteredReceivables.map((r: any) => ({
      id: r.invoice_id,
      date: r.created_at || r.tanggal_pengiriman,
      subject: r.outlet_name,
      amount: parseAmount(r.total_tagihan),
      type: "Piutang",
      status: r.status || "Belum Lunas",
    })),
    ...filteredPayables.map((p: any) => ({
      id: p.no_nota_vendor,
      date: p.created_at || p.tanggal_nota,
      subject: p.nama_vendor,
      amount: parseAmount(p.total_tagihan),
      type: "Hutang",
      status: p.status || "Belum Lunas",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mode = searchParams.mode || "monthly";
  let periodLabel = "Bulan Ini";
  if (mode === "daily")
    periodLabel = `Tanggal ${
      searchParams.date || new Date().toISOString().split("T")[0]
    }`;
  if (mode === "monthly")
    periodLabel = `Bulan ${
      searchParams.month || new Date().getMonth() + 1
    } Tahun ${searchParams.year || new Date().getFullYear()}`;
  if (mode === "yearly")
    periodLabel = `Tahun ${searchParams.year || new Date().getFullYear()}`;

  return {
    role,
    stats: {
      totalProduk,
      stokHabis,
      totalPiutang,
      totalHutang,
      totalTransaksi,
    },
    activities: allTransactions.slice(0, 10),
    exportData: allTransactions,
    periodLabel,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const { role, stats, activities, exportData, periodLabel } =
    await getDashboardData(params);

  if (!stats)
    return (
      <div className="p-10 text-center text-slate-500">Gagal Memuat Data</div>
    );

  const cards = [
    {
      label: "Total Produk",
      value: stats.totalProduk,
      icon: "📦",
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      sub: "Semua item",
    },
    {
      label: "Total Transaksi",
      value: stats.totalTransaksi,
      icon: "📊",
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      sub: `Periode ${periodLabel}`,
    },
    {
      label: "Stok Habis",
      value: stats.stokHabis,
      icon: "⚠️",
      color: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-600",
      sub: "Perlu restock",
    },
    {
      label: "Piutang Outlet",
      value: formatRupiah(stats.totalPiutang),
      icon: "💰",
      color: "bg-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      sub: "Belum Lunas",
    },
    {
      label: "Total Hutang",
      value: formatRupiah(stats.totalHutang),
      icon: "🧾",
      color: "bg-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
      sub: "Belum Lunas",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <AdminChoiceModal userRole={role} />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h2>
          <p className="text-slate-500">
            Periode Laporan:{" "}
            <span className="text-indigo-600 font-bold">{periodLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Kita perlu menyesuaikan komponen DashboardFilter agar teksnya gelap */}
          <div className="text-slate-700">
            <DashboardFilter />
          </div>
          <ExportButton data={exportData} period={periodLabel} />
        </div>
      </div>

      {/* Stats Grid - Ubah ke Kartu Putih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className={`w-12 h-12 rounded-xl ${card.bg} ${card.text} flex items-center justify-center text-2xl`}
              >
                {card.icon}
              </div>
            </div>

            <div>
              <h3
                className="text-xl font-bold text-slate-800 tracking-tight mb-1 truncate"
                title={String(card.value)}
              >
                {card.value}
              </h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-slate-400 text-[10px]">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - Kartu Putih */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Analitik Keuangan
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan kewajiban dan tagihan aktif
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                stats.totalPiutang > stats.totalHutang
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {stats.totalPiutang > stats.totalHutang
                ? "Surplus Potensial"
                : "Defisit Potensial"}
            </div>
          </div>

          <div className="flex-1 w-full h-full min-h-[300px]">
            <DashboardChart
              piutang={stats.totalPiutang}
              hutang={stats.totalHutang}
            />
          </div>
        </div>

        {/* Activity Feed - Kartu Putih */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Aktivitas {periodLabel}
            </h3>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                      activity.type === "Piutang"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {activity.type === "Piutang" ? "📤" : "📥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-slate-800 font-bold truncate">
                        {activity.id}
                      </p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {timeAgo(activity.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {activity.subject}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          (activity.status || "").toLowerCase() === "lunas"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.status || "Belum Lunas"}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {formatRupiah(Number(activity.amount))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                Tidak ada transaksi di periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
