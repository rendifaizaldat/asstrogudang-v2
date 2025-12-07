// utils/pdfGenerator.ts

const formatRupiah = (num: any) => {
  const value = Number(num) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const safeAmount = (val: any) => Number(val) || 0;

// Parameter allProducts wajib ada dan di-default ke []
export const generateHTMLReport = (
  data: any[],
  allProducts: any[] = [],
  outletFilter: string,
  dateRange: string
) => {
  // 1. Buat Map Produk (ID -> Data Produk) untuk pencarian cepat
  const productMap = new Map();
  if (Array.isArray(allProducts)) {
    allProducts.forEach((p) => {
      if (p && p.id) productMap.set(p.id, p);
    });
  }

  // Template Dasar HTML
  const template = `
    <div style="font-family: Arial, sans-serif; width: 100%; max-width: 800px; margin: auto; color: #333;">
      <table style="width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px;">
        <tbody>
          <tr>
            <td style="width: 100px; vertical-align: top;">
              <img style="width: 80px; height: auto;" src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=180,fit=crop,q=95/ALpeWM5b1Js3G9vP/logo-asstro-hires-mjE7bw10LXFGo53w.png" alt="Logo Perusahaan">
            </td>
            <td style="vertical-align: top;">
              <h1 style="margin: 0; font-size: 18pt; font-weight: bold;">Gudang Bandung Raya</h1>
              <p style="margin: 0; font-size: 10pt;">Jl. Raya Lembang No.177D</p>
            </td>
          </tr>
        </tbody>
      </table>
      
      <table style="width: 100%; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 15px; font-size: 11pt;">
        <tbody>
          <tr>
            <td style="width: 150px;"><strong>Tagihan Untuk</strong></td>
            <td>: {{nama_outlet}}</td>
          </tr>
          <tr>
            <td><strong>Tanggal Laporan</strong></td>
            <td>: {{tanggal_laporan}}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 25px;">{{tabel_tagihan_outlet}}</div>
      <div style="margin-top: 20px; page-break-before: auto;">{{rincian_semua_invoice}}</div>

      <div style="margin-top: 30px; text-align: right; border-top: 2px solid #000; padding-top: 10px;">
        <h2 style="font-size: 14pt; margin: 0;">Total Tagihan Keseluruhan: {{total_semua_tagihan}}</h2>
      </div>

      <div style="margin-top: 40px; font-size: 9pt; color: #777; text-align: center;">
        <p>Laporan ini dibuat secara otomatis oleh sistem. <span style="font-weight: bold; font-style: italic;">Cek kembali rincian pesanan orderan Anda.</span> Terima kasih.</p>
      </div>
    </div>
  `;

  // 2. GENERATE TABEL RINGKASAN
  let totalKeseluruhan = 0;
  const rows = data
    .map((item) => {
      const total = safeAmount(item.total_tagihan || item.total);
      totalKeseluruhan += total;
      return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          item.invoice_id || "-"
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(
          item.tanggal_pengiriman
        )}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          item.outlet_name || "Umum"
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatRupiah(
          total
        )}</td>
      </tr>
    `;
    })
    .join("");

  const tabelRingkasan = `
    <h3 style="font-size: 12pt; margin-bottom: 10px;">Ringkasan Tagihan</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Invoice</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tanggal</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Outlet</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // 3. GENERATE RINCIAN PER INVOICE
  const rincianInvoice = data
    .map((invoice) => {
      const items = invoice.transaction_items || [];

      if (items.length === 0) return "";

      const itemsRows = items
        .map((item: any) => {
          // LOGIC PENTING: Cari nama produk dari Map berdasarkan ID
          const product = productMap.get(item.product_id);

          const namaProduk =
            product?.nama || item.products?.nama || "Item Tidak Dikenal";
          const unit = product?.unit || item.products?.unit || "";
          const qty = safeAmount(item.quantity);
          const harga = safeAmount(item.price_per_unit);

          // Hitung ulang subtotal jika 0 (karena kadang backend tidak mengirim subtotal)
          let subtotal = safeAmount(item.subtotal);
          if (subtotal === 0) subtotal = qty * harga;

          return `
        <tr>
          <td style="padding: 5px; border-bottom: 1px solid #eee;">${namaProduk}</td>
          <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: center;">${qty} ${unit}</td>
          <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatRupiah(
            harga
          )}</td>
          <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatRupiah(
            subtotal
          )}</td>
        </tr>
      `;
        })
        .join("");

      return `
      <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
          <strong>Invoice: ${invoice.invoice_id}</strong>
          <span>${formatDate(invoice.tanggal_pengiriman)}</span>
        </div>
        <table style="width: 100%; font-size: 9pt; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left;">Produk</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Harga</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="text-align: right; margin-top: 10px; font-weight: bold;">
          Total: ${formatRupiah(safeAmount(invoice.total_tagihan))}
        </div>
      </div>
    `;
    })
    .join("");

  return template
    .replace(
      "{{nama_outlet}}",
      outletFilter === "all" || !outletFilter ? "Semua Outlet" : outletFilter
    )
    .replace("{{tanggal_laporan}}", dateRange)
    .replace("{{tabel_tagihan_outlet}}", tabelRingkasan)
    .replace("{{rincian_semua_invoice}}", rincianInvoice)
    .replace("{{total_semua_tagihan}}", formatRupiah(totalKeseluruhan));
};

// --- GENERATOR LAPORAN HUTANG VENDOR (BARU) ---
export const generateHutangReport = (data: any[], dateRange: string) => {
  // 1. Grouping Data
  const groupedData = data.reduce((acc: any, item) => {
    const vendor = item.nama_vendor || "Tanpa Nama";
    if (!acc[vendor]) {
      acc[vendor] = {
        items: [],
        total: 0,
        // Simpan referensi item pertama untuk mengambil data bank yang sudah di-merge di actions.ts
        details: item,
      };
    }
    acc[vendor].items.push(item);
    acc[vendor].total += safeAmount(item.total_tagihan);
    return acc;
  }, {});

  // 2. Generate Rows
  let tableRows = "";
  let grandTotal = 0;

  Object.entries(groupedData).forEach(([vendor, group]: [string, any]) => {
    // Format Info Bank: Bank - No.Rek a.n Nama
    // Jika data tidak ada (karena merge gagal atau kosong), tampilkan '-'
    const bankInfo = `${group.details.bank || "-"} - ${
      group.details.rekening || "-"
    } a.n ${group.details.atas_nama || "-"}`;

    // Header Vendor dengan Info Bank
    tableRows += `
      <tr style="background-color: #f1f5f9;">
        <td colspan="5" style="padding: 12px 10px; border: 1px solid #ddd;">
          <div style="font-weight: bold; font-size: 1.1em; color: #1e293b;">
            ${vendor} <br/>
            <span style="font-weight: normal; font-size: 0.85em; color: #64748b; margin-top: 4px; display: inline-block;">
              🏦 ${bankInfo}
            </span>
          </div>
        </td>
      </tr>
    `;

    // Item Transaksi
    group.items.forEach((item: any) => {
      grandTotal += safeAmount(item.total_tagihan);
      const statusColor =
        (item.status || "").toLowerCase() === "lunas"
          ? "color: #15803d;"
          : "color: #b45309;";

      tableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #475569;">${formatDate(
            item.tanggal_nota
          )}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #334155;">${
            item.no_nota_vendor
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #64748b;">Tagihan Pembelian</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 0.9em; ${statusColor} font-weight: 500;">${
        item.status || "Belum Lunas"
      }</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: 500;">${formatRupiah(
            item.total_tagihan
          )}</td>
        </tr>
      `;
    });

    // Subtotal Vendor
    tableRows += `
      <tr>
        <td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #475569;">Total Tagihan ${vendor}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; background-color: #f8fafc; color: #0f172a;">${formatRupiah(
          group.total
        )}</td>
      </tr>
    `;
  });

  const fullTable = `
    <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 15px;">
      <thead>
        <tr style="background-color: #4f46e5; color: white;">
          <th style="padding: 10px; border: 1px solid #4f46e5;">Tanggal</th>
          <th style="padding: 10px; border: 1px solid #4f46e5;">No. Nota</th>
          <th style="padding: 10px; border: 1px solid #4f46e5;">Keterangan</th>
          <th style="padding: 10px; border: 1px solid #4f46e5;">Status</th>
          <th style="padding: 10px; border: 1px solid #4f46e5; text-align: right;">Nominal</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  // Template HTML sesuai request user
  const template = `
    <div class="report-container" style="font-family: 'Inter', sans-serif; max-width: 850px; margin: auto; color: #333;">
      <div class="report-header" style="display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
        <div class="logo" style="margin-right: 20px;">
          <img src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=180,fit=crop,q=95/ALpeWM5b1Js3G9vP/logo-asstro-hires-mjE7bw10LXFGo53w.png" alt="Logo Perusahaan" style="width: 80px; height: 80px; object-fit: contain;">
        </div>
        <div class="title">
          <h1 style="margin: 0; font-size: 24px; color: #1e293b;">Laporan Hutang Vendor</h1>
          <p style="margin: 5px 0 0; color: #64748b;">Tanggal Laporan: {{tanggal_laporan}}</p>
        </div>
      </div>
      
      <div class="report-intro" style="margin-bottom: 20px;">
        <p>Berikut adalah rincian tagihan dari vendor yang perlu dibayarkan:</p>
      </div>
      
      {{tabel_laporan_vendor}}
      
      <div class="report-total" style="text-align: right; margin-top: 30px; border-top: 2px dashed #ccc; padding-top: 20px;">
        <h2 style="margin: 0; color: #0f172a;">Total Keseluruhan: {{total_semua_tagihan}}</h2>
      </div>
      
      <div class="signature-section" style="margin-top: 50px; float: right; text-align: center; width: 200px;">
        <p class="prepared-by" style="margin-bottom: 10px;">Disiapkan oleh,</p>
        <p class="prepared-by" style="text-align: center; line-height: 1; margin: 10px auto;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Tanda_tangan_bapak.png" alt="tanda tangan" width="115" height="115" style="display: block; margin: auto;">
        </p>
        <p class="name" style="margin: 5px 0 0; border-top: 1px solid #333; padding-top: 5px;">(_________________________)</p>
        <p class="title" style="margin: 0; font-weight: bold;">Rendi Faizal Dat</p>
      </div>
      
      <div style="clear: both;"></div>
    </div>
  `;

  return template
    .replace("{{tanggal_laporan}}", dateRange)
    .replace("{{tabel_laporan_vendor}}", fullTable)
    .replace("{{total_semua_tagihan}}", formatRupiah(grandTotal));
};

// --- GENERATOR LAPORAN ANALYTICS (P&L) ---
export const generateAnalyticsReport = (
  summary: any,
  topProducts: any[],
  period: { start: string; end: string }
) => {
  // Format mata uang helper
  const fmt = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(num);

  // Generate Baris Produk
  const productRows = topProducts
    .map(
      (p, i) => `
    <tr>
      <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${
        i + 1
      }</td>
      <td style="padding: 6px; border-bottom: 1px solid #eee;">${p.name}</td>
      <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${
        p.qty
      }</td>
      <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${fmt(
        p.revenue
      )}</td>
      <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #10b981;">${fmt(
        p.profit
      )}</td>
    </tr>
  `
    )
    .join("");

  const template = `
    <div style="font-family: 'Helvetica', sans-serif; max-width: 800px; margin: auto; color: #333; padding: 20px;">
      
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #1e293b; text-transform: uppercase;">Laporan Profit & Loss (Estimasi)</h1>
        <p style="margin: 5px 0; color: #64748b;">Periode: ${
          period.start
        } s/d ${period.end}</p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Gudang Bandung Raya</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">Rangkuman Keuangan</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #475569;">Total Pendapatan (Revenue)</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${fmt(
              summary.revenue
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569;">Harga Pokok Penjualan (COGS)</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">(${fmt(
              summary.cogs
            )})</td>
          </tr>
          <tr>
             <td colspan="2" style="border-bottom: 1px dashed #cbd5e1;"></td>
          </tr>
          <tr style="font-size: 18px;">
            <td style="padding: 15px 0; font-weight: bold; color: #1e293b;">GROSS PROFIT</td>
            <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #16a34a;">${fmt(
              summary.grossProfit
            )}</td>
          </tr>
           <tr>
            <td style="padding: 0; font-size: 12px; color: #64748b;">Margin Keuntungan</td>
            <td style="padding: 0; text-align: right; font-size: 12px; font-weight: bold; color: #d97706;">${summary.margin.toFixed(
              2
            )}%</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="margin-bottom: 10px; color: #1e293b;">Top 10 Produk (Berdasarkan Profit)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead style="background-color: #f1f5f9;">
            <tr>
              <th style="padding: 10px; text-align: center;">#</th>
              <th style="padding: 10px; text-align: left;">Nama Produk</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Omzet</th>
              <th style="padding: 10px; text-align: right;">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8;">
        <p>Laporan ini digenerate otomatis oleh sistem Asstrogudang v2.</p>
      </div>

    </div>
  `;

  return template;
};

// --- 4. CETAK INVOICE SATUAN ---
export const generateInvoiceHTML = (transaction: any, settings: any) => {
  const items = transaction.transaction_items || [];
  let itemRows = "";

  items.forEach((item: any, index: number) => {
    itemRows += `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${
          index + 1
        }</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">
          <div style="font-weight:bold;">${
            item.products?.nama || "Item Dihapus"
          }</div>
          <div style="font-size:10px; color:#64748b;">${
            item.products?.kode_produk || "-"
          }</div>
        </td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${
          item.quantity
        } ${item.products?.unit || ""}</td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatRupiah(
          item.price_per_unit
        )}</td>
        <td style="padding:8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${formatRupiah(
          item.subtotal
        )}</td>
      </tr>
    `;
  });

  return `
    <div style="font-family:'Inter', sans-serif; max-width:800px; margin:auto; color:#333; padding:20px; border:1px solid #eee;">
      
      <table style="width:100%; margin-bottom:30px;">
        <tr>
          <td width="60%" valign="top">
             ${
               settings?.company_logo_url
                 ? `<img src="${settings.company_logo_url}" alt="Logo" style="height:60px; object-fit:contain; margin-bottom:10px;">`
                 : `<h1 style="margin:0; color:#4f46e5;">INVOICE</h1>`
             }
             <div style="font-weight:bold; font-size:18px;">${
               settings?.company_name || "Asstrogudang"
             }</div>
             <div style="font-size:12px; color:#64748b; max-width:300px;">${
               settings?.company_address || ""
             }</div>
          </td>
          <td width="40%" valign="top" style="text-align:right;">
            <h2 style="margin:0; color:#cbd5e1; font-size:24px; letter-spacing:2px;">INVOICE</h2>
            <table style="width:100%; margin-top:10px; font-size:12px;">
              <tr>
                <td style="text-align:right; color:#64748b;">No. Invoice:</td>
                <td style="text-align:right; font-weight:bold;">${
                  transaction.invoice_id
                }</td>
              </tr>
              <tr>
                <td style="text-align:right; color:#64748b;">Tanggal:</td>
                <td style="text-align:right; font-weight:bold;">${formatDate(
                  transaction.tanggal_pengiriman
                )}</td>
              </tr>
              <tr>
                <td style="text-align:right; color:#64748b;">Status:</td>
                <td style="text-align:right; font-weight:bold; color:${
                  (transaction.status || "").toLowerCase() === "lunas"
                    ? "green"
                    : "red"
                }">
                  ${(transaction.status || "Belum Lunas").toUpperCase()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="margin-bottom:30px; background:#f8fafc; padding:15px; border-radius:8px;">
        <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:bold; margin-bottom:5px;">Kepada Yth:</div>
        <div style="font-size:16px; font-weight:bold; color:#1e293b;">${
          transaction.outlet_name
        }</div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:30px;">
        <thead style="background:#1e293b; color:white;">
          <tr>
            <th style="padding:10px; text-align:center; width:50px;">#</th>
            <th style="padding:10px; text-align:left;">Deskripsi Item</th>
            <th style="padding:10px; text-align:center; width:80px;">Qty</th>
            <th style="padding:10px; text-align:right; width:120px;">Harga</th>
            <th style="padding:10px; text-align:right; width:120px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding:15px; text-align:right; font-weight:bold; border-top:2px solid #333;">TOTAL TAGIHAN</td>
            <td style="padding:15px; text-align:right; font-weight:bold; font-size:16px; color:#4f46e5; border-top:2px solid #333;">
              ${formatRupiah(transaction.total_tagihan)}
            </td>
          </tr>
        </tfoot>
      </table>

      <table style="width:100%; margin-top:50px;">
        <tr>
          <td width="60%" valign="bottom" style="font-size:10px; color:#94a3b8;">
            ${
              settings?.invoice_footer_text ||
              "Terima kasih atas kerjasama Anda."
            }
          </td>
          <td width="40%" valign="top" style="text-align:center;">
            <div style="font-size:11px; margin-bottom:10px;">Hormat Kami,</div>
            ${
              settings?.signature_url
                ? `<img src="${settings.signature_url}" style="height:80px; object-fit:contain; display:block; margin:0 auto;">`
                : `<div style="height:80px;"></div>`
            }
            <div style="font-size:11px; font-weight:bold; border-top:1px solid #ccc; padding-top:5px; margin-top:5px; display:inline-block; min-width:150px;">
              ${settings?.signer_name || "Admin Gudang"}
            </div>
          </td>
        </tr>
      </table>

    </div>
  `;
};
