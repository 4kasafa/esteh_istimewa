import { useMemo, useState } from "react";
import { Coffee, Receipt, TrendingUp, Wallet } from "lucide-react";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import BarChart from "./BarChart";
import { toCurrency, toPeriodValue } from "../../utils/formatters";
import {
  applyDashboardFilters,
  buildAreaPerformance,
  buildExecutiveKpi,
  buildDonutData,
  buildLineSeries,
  sanitizeDatabaseRows,
} from "../../utils/dashboard";

// Hero Card: Metrik finansial utama untuk business owner
function HeroCard({ totalSales, totalDeposit }) {
  const [activeTab, setActiveTab] = useState("omset");

  const efficiency = totalSales > 0 ? Math.round((totalDeposit / totalSales) * 100) : 0;
  const expensePct = 100 - efficiency;

  const tabButtonClass = (tab) =>
    `px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-2xl transition-all ${
      activeTab === tab
        ? "bg-white text-emerald-900 shadow-sm"
        : "bg-emerald-900/30 text-emerald-200 hover:bg-emerald-800/40"
    }`;

  return (
    <div className="rounded-3xl bg-linear-to-br from-brand-green-dark to-emerald-800 p-4 sm:p-5 shadow-xl shadow-brand-green-dark/20">
      <div className="flex items-center gap-2 mb-4">
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
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none animate-in fade-in slide-in-from-left-1 duration-300">
              {toCurrency(totalSales)}
            </h2>
            <div className="mt-3 flex items-center gap-2">
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
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none animate-in fade-in slide-in-from-right-1 duration-300">
              {toCurrency(totalDeposit)}
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                Efisiensi {efficiency}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-300">
                Beban {expensePct}%
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
    <div className="grid grid-cols-3 gap-2">
      {chips.map((chip) => {
        const ChipIcon = chip.icon;
        return (
          <div key={chip.label} className="rounded-2xl border border-brand-green/8 bg-white px-2.5 py-2.5 sm:px-3 sm:py-3">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1.5 ${chip.color}`}>
              <ChipIcon size={13} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand-muted leading-tight">{chip.label}</p>
            <p className="mt-0.5 text-[11px] sm:text-xs font-black text-brand-green-dark wrap-break-word leading-tight">{chip.value}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewPanel({ dbRows, periodFilter }) {
  // Gunakan periodFilter yang dikirim dari DashboardPage (controlled)
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
  const areaData = useMemo(() => buildAreaPerformance(scopedRows), [scopedRows]);

  return (
    <div className="space-y-3 sm:space-y-4 overflow-x-hidden">
      {/* Hero Card Finansial */}
      <HeroCard
        totalSales={cards.totalSales}
        totalDeposit={cards.totalDeposit}
        totalExpenses={cards.totalExpenses}
      />

      {/* Mini Chips */}
      <MiniChips
        totalExpenses={cards.totalExpenses}
        totalCups={cards.totalCups}
        topBranch={cards.topBranch}
      />

      {/* Grafik: Tren Harian */}
      <div className="rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-5 card-shadow">
        <h4 className="mb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
          Tren Pemasukan Harian
        </h4>
        <LineChart data={lineSeries} />
      </div>

      {/* Grafik: Performa Per Cabang + Donut berdampingan di desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4">
        <div className="xl:col-span-8 rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-5 card-shadow">
          <h4 className="mb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
            Performa Per Cabang
          </h4>
          <BarChart data={areaData} color="#F6C945" />
        </div>

        <div className="xl:col-span-4 rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-5 card-shadow">
          <h4 className="mb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
            Kontribusi Cabang
          </h4>
          <DonutChart data={donutData} />
        </div>
      </div>
    </div>
  );
}
