import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Receipt, TrendingUp, Wallet } from "lucide-react";
import DonutChart from "./DonutChart";
import LineChart from "./LineChart";
import { toCurrency, toPeriodValue, formatShortDate } from "../../utils/formatters";
import {
  applyDashboardFilters,
  buildExecutiveKpi,
  buildDonutData,
  buildLineSeries,
  sanitizeDatabaseRows,
} from "../../utils/dashboard";
import { buildTransactionList } from "../../utils/reports";

// ponytail: split HeroCard tab -> 2 kartu mandiri, tanpa tab state
function OmsetCard({ totalSales, totalDeposit }) {
  const efficiency = totalSales > 0 ? Math.round((totalDeposit / totalSales) * 100) : 0;
  const expensePct = 100 - efficiency;

  return (
    <div className="rounded-3xl bg-linear-to-br from-brand-green-dark to-emerald-800 text-white p-4 sm:p-5 shadow-xl shadow-brand-green-dark/20 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-white/15">
          <TrendingUp size={14} className="text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Total Omset</p>
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
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
      </div>
    </div>
  );
}

function DepositCard({ totalDeposit, totalSales }) {
  const efficiency = totalSales > 0 ? Math.round((totalDeposit / totalSales) * 100) : 0;

  return (
    <div className="rounded-3xl bg-white border border-brand-green/12 card-shadow text-brand-green-dark p-4 sm:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700">
          <Wallet size={14} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-brand-muted">Setoran Bersih</p>
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
          {toCurrency(totalDeposit)}
        </h2>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 text-[10px] font-black">
            Efisiensi {efficiency}%
          </span>
        </div>
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
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2.5 lg:h-full items-stretch">
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
              <p className="text-xs sm:text-base font-black text-brand-green-dark wrap-break-word leading-tight text-center">
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
                    <td className="py-2 px-2.5 font-black text-brand-green-dark whitespace-nowrap truncate max-w-32.5">
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

export default function OverviewPanel({
  reportRows = [],
  dbRows = [],
  periodFilter,
  loading = false,
  isSyncing = false,
}) {
  const [activeCard, setActiveCard] = useState(0);
  const userInteractedRef = useRef(false);

  // Animasi slide otomatis ke Setoran Bersih lalu kembali lagi saat refresh / data dimuat
  useEffect(() => {
    if (loading || isSyncing) return;

    userInteractedRef.current = false;

    const timerReset = setTimeout(() => {
      if (userInteractedRef.current) return;
      setActiveCard(0);
    }, 0);

    const timer1 = setTimeout(() => {
      if (userInteractedRef.current) return;
      setActiveCard(1); // Geser ke samping ke Setoran Bersih

      const timer2 = setTimeout(() => {
        if (userInteractedRef.current) return;
        setActiveCard(0); // Geser kembali ke Total Omset
      }, 1500);

      return () => clearTimeout(timer2);
    }, 700);

    return () => {
      clearTimeout(timerReset);
      clearTimeout(timer1);
    };
  }, [loading, isSyncing]);

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
    <div className="flex flex-col gap-3 sm:gap-4 overflow-x-hidden lg:grid lg:grid-cols-12 lg:items-start">
      {/* Kolom Kiri: kartu + line chart + tabel (mobile: contents, urutan via order) */}
      {/* ponytail: 2 wrapper kolom khusus desktop; mobile tembus via contents */}
      <div className="contents lg:col-span-8 lg:flex lg:flex-col lg:gap-4">
        {/* ① Kartu desktop: 2 kartu berdampingan, tinggi natural */}
        <div className="hidden lg:grid grid-cols-2 gap-4">
          <OmsetCard
            totalSales={cards.totalSales}
            totalDeposit={cards.totalDeposit}
          />
          <DepositCard
            totalDeposit={cards.totalDeposit}
            totalSales={cards.totalSales}
          />
        </div>
        {/* ① Kartu mobile: carousel Omset/Setoran + dots dengan animasi slide halus */}
        <div
          className="order-1 lg:order-none lg:hidden"
          onTouchStart={(e) => {
            userInteractedRef.current = true;
            e.currentTarget.dataset.sx = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const sx = Number(e.currentTarget.dataset.sx || 0);
            const dx = e.changedTouches[0].clientX - sx;
            if (dx < -40) {
              userInteractedRef.current = true;
              setActiveCard(1);
            } else if (dx > 40) {
              userInteractedRef.current = true;
              setActiveCard(0);
            }
          }}
        >
          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeCard * 100}%)` }}
            >
              <div className="w-full shrink-0">
                <OmsetCard totalSales={cards.totalSales} totalDeposit={cards.totalDeposit} />
              </div>
              <div className="w-full shrink-0">
                <DepositCard totalDeposit={cards.totalDeposit} totalSales={cards.totalSales} />
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-1.5 mt-2">
            <button
              aria-label="Kartu omset"
              onClick={() => {
                userInteractedRef.current = true;
                setActiveCard(0);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeCard === 0 ? "w-6 bg-brand-green" : "w-2 bg-brand-green/20"
              }`}
            />
            <button
              aria-label="Kartu setoran"
              onClick={() => {
                userInteractedRef.current = true;
                setActiveCard(1);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeCard === 1 ? "w-6 bg-brand-green" : "w-2 bg-brand-green/20"
              }`}
            />
          </div>
        </div>
        {/* ② Line chart + tabel ringkas */}
        <div className="order-3 lg:order-none flex flex-col gap-3">
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
      </div>

      {/* Kolom Kanan: chips + donut */}
      <div className="contents lg:col-span-4 lg:flex lg:flex-col lg:gap-4">
        {/* ③ MiniChips */}
        <div className="order-2 lg:order-none">
          <MiniChips
            totalExpenses={cards.totalExpenses}
            totalCups={cards.totalCups}
            topBranch={cards.topBranch}
          />
        </div>

        {/* ④ Donut Chart */}
        <div className="order-4 lg:order-none rounded-3xl border border-brand-green/10 bg-white p-3 sm:p-4 card-shadow">
          <h4 className="mb-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-muted">
            Kontribusi Cabang
          </h4>
          <DonutChart data={donutData} />
        </div>
      </div>
    </div>
  );
}
