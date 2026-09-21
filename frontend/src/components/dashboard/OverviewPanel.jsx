import { useMemo, useState } from "react";
import { Coffee, Receipt, TrendingUp } from "lucide-react";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import { toCurrency, toPeriodValue } from "../../utils/formatters";
import {
  applyDashboardFilters,
  buildExecutiveKpi,
  buildDonutData,
  buildLineSeries,
  sanitizeDatabaseRows,
} from "../../utils/dashboard";
import { buildTransactionList } from "../../utils/reports";

function formatShortDate(ts) {
  if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return "-";
  const dd = String(ts.getDate()).padStart(2, "0");
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

// Hero Card: Metrik finansial utama untuk business owner
function HeroCard({ totalSales, totalDeposit }) {
  const [activeTab, setActiveTab] = useState("omset");

  const efficiency = totalSales > 0 ? Math.round((totalDeposit / totalSales) * 100) : 0;
  const expensePct = 100 - efficiency;

  const tabButtonClass = (tab) =>
    `px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
      activeTab === tab
        ? "bg-white text-emerald-900 shadow-sm"
        : "bg-emerald-900/30 text-emerald-200 hover:bg-emerald-800/40"
    }`;

  return (
    <div className="rounded-3xl bg-linear-to-br from-brand-green-dark to-emerald-800 p-4 sm:p-5 shadow-xl shadow-brand-green-dark/20 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setActiveTab("omset")} className={tabButtonClass("omset")}>
          Total Omset
        </button>
        <button onClick={() => setActiveTab("setoran")} className={tabButtonClass("setoran")}>
          Setoran Bersih
        </button>
      </div>

      <div className="min-w-0">
        {activeTab === "omset" ? (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none animate-in fade-in slide-in-from-left-1 duration-300">
              {toCurrency(totalSales)}
            </h2>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                Net {efficiency}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-300">
                Beban {expensePct}%
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none animate-in fade-in slide-in-from-right-1 duration-300">
              {toCurrency(totalDeposit)}
            </h2>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                Efisiensi {efficiency}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Mini Chips: Metrik pendukung dalam baris horizontal
function MiniChips({ totalExpenses, totalCups, topBranch }) {
  const chips = [
    { icon: Receipt, label: "Pengeluaran", value: toCurrency(totalExpenses), color: "text-amber-600 bg-amber-50" },
    { icon: Coffee, label: "Total Cup", value: `${totalCups} Cup`, color: "text-emerald-700 bg-emerald-50" },
    { icon: TrendingUp, label: "Cabang Juara", value: topBranch || "-", color: "text-brand-green-dark bg-brand-green/5" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 h-full items-stretch">
      {chips.map((chip) => {
        const ChipIcon = chip.icon;
        return (
          <div
            key={chip.label}
            className="rounded-3xl border border-brand-green/8 bg-white p-3 sm:p-4 flex flex-col justify-between card-shadow"
          >
            {/* Bagian Atas: Icon & Label berdampingan */}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${chip.color}`}>
                <ChipIcon size={14} />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand-muted leading-tight truncate">
                {chip.label}
              </p>
            </div>

            {/* Bagian Bawah: Angka / Nilai di Tengah Center */}
            <div className="my-auto py-1.5 flex items-center justify-center text-center">
              <p className="text-xs sm:text-base font-black text-brand-green-dark break-words leading-tight text-center">
                {chip.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Table Ringkasan Data Transaksi Ringkas (Khusus Desktop)
function CompactTransactionTable({ transactions = [] }) {
  return (
    <div className="rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-4 card-shadow">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
          Ringkasan Transaksi
        </h4>
        <span className="text-[10px] font-bold text-brand-muted">
          {transactions.length} entri data
        </span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-brand-bg text-[9px] font-black uppercase tracking-wider text-brand-muted/70">
              <th className="py-2 px-2.5">Tgl</th>
              <th className="py-2 px-2.5">Type</th>
              <th className="py-2 px-2.5">Cabang</th>
              <th className="py-2 px-2.5 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-bg/60">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-brand-muted font-bold text-xs">
                  Belum ada transaksi pada periode ini
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const isIncome = tx.type === "PEMASUKAN";
                return (
                  <tr key={idx} className="hover:bg-brand-bg/40 transition-colors">
                    <td className="py-2 px-2.5 font-bold text-brand-muted whitespace-nowrap">
                      {formatShortDate(tx.timestamp)}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isIncome
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-red-500/15 text-red-600"
                        }`}
                      >
                        {isIncome ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-black text-brand-green-dark whitespace-nowrap truncate max-w-[130px]">
                      {tx.arusDana || tx.cabang || "-"}
                    </td>
                    <td
                      className={`py-2 px-2.5 text-right font-black whitespace-nowrap ${
                        isIncome ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {toCurrency(tx.nominal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OverviewPanel({ reportRows = [], dbRows = [], periodFilter }) {
  const filter = useMemo(
    () => periodFilter || { range: "month", period: toPeriodValue() },
    [periodFilter],
  );

  const normalizedRows = useMemo(() => sanitizeDatabaseRows(dbRows), [dbRows]);
  const scopedRows = useMemo(() => {
    return applyDashboardFilters(normalizedRows, filter);
  }, [filter, normalizedRows]);

  const cards = useMemo(() => buildExecutiveKpi(scopedRows), [scopedRows]);
  const donutData = useMemo(() => buildDonutData(scopedRows), [scopedRows]);
  const lineSeries = useMemo(() => {
    return buildLineSeries(scopedRows, {
      range: filter.range,
      period: filter.period || toPeriodValue(),
      date: filter.date,
    });
  }, [filter.date, filter.period, filter.range, scopedRows]);

  const recentTransactions = useMemo(() => {
    const list = buildTransactionList(reportRows, dbRows);
    return list.slice(0, 5);
  }, [reportRows, dbRows]);

  return (
    <div className="space-y-3 sm:space-y-4 overflow-x-hidden">
      {/* Baris Atas: Card Hero di kiri + MiniChips di sampingnya */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <HeroCard
            totalSales={cards.totalSales}
            totalDeposit={cards.totalDeposit}
          />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <MiniChips
            totalExpenses={cards.totalExpenses}
            totalCups={cards.totalCups}
            topBranch={cards.topBranch}
          />
        </div>
      </div>

      {/* Baris Bawah: Grafik & Tabel Ringkas di kiri/tengah + Donut di sampingnya */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Kolom Kiri/Tengah: Grafik Card & Table Ringkasan Data Transaksi */}
        <div className="lg:col-span-8 space-y-3">
          {/* Grafik Card */}
          <div className="rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-4 card-shadow">
            <h4 className="mb-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
              Tren Pemasukan Harian
            </h4>
            <LineChart data={lineSeries} />
          </div>

          {/* Table Ringkas Data Transaksi: HANYA ada di desktop, hidden di mobile */}
          <div className="hidden lg:block">
            <CompactTransactionTable transactions={recentTransactions} />
          </div>
        </div>

        {/* Kolom Kanan: Donut Chart disamping bagian bawah */}
        <div className="lg:col-span-4 rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-4 card-shadow">
          <h4 className="mb-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
            Kontribusi Cabang
          </h4>
          <DonutChart data={donutData} />
        </div>
      </div>
    </div>
  );
}
