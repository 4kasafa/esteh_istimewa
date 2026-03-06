import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";

import Alert from "../common/Alert";
import CustomSelect from "../common/CustomSelect";
import DataTable from "./DataTable";
import { mapApiErrorMessage } from "../../utils/errors";
import { filterRows } from "../../utils/dashboard";
import { parseTimestamp, toFormattedTimestamp, toPeriodValue } from "../../utils/formatters";
import { BRANCH_OPTIONS, KASIR_OPTIONS, SHIFT_OPTIONS } from "../../constants/forms";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
});

const ARUS_DANA_TARGET = "setoran bank bri";

function buildEmptyForm(userName = "") {
  return {
    "TIMESTAMP INPUT": toFormattedTimestamp(),
    SHIFT: SHIFT_OPTIONS[0] || "",
    "ARUS DANA": BRANCH_OPTIONS[0] || "",
    KASIR: userName || KASIR_OPTIONS[0] || "",
    "UANG KELUAR": "",
    KETERANGAN: "",
  };
}

function normalizeArusDana(value) {
  return String(value || "").trim().toLowerCase();
}

const HIDDEN_COLUMNS = new Set([
  "input kasir",
  "pengeluaran",
  "uang masuk",
  "status selisih",
  "selisih",
  "saldo akhir",
]);

function sanitizeRow(row) {
  const sanitized = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key && HIDDEN_COLUMNS.has(String(key).trim().toLowerCase())) {
      return;
    }
    sanitized[key] = value;
  });
  return sanitized;
}

function formatMonthLabel(period) {
  const [year, month] = String(period || "").split("-");
  const parsedYear = Number(year);
  const parsedMonth = Number(month) - 1;
  if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth)) {
    return period || "-";
  }
  return MONTH_LABEL_FORMATTER.format(new Date(parsedYear, parsedMonth, 1)).toUpperCase();
}

function extractTimestamp(row) {
  return parseTimestamp(row["TIMESTAMP INPUT"] || row["TIME STAMP INPUT"] || row.TIMESTAMP || row.timestamp);
}

export default function KasKeluarPanel({ dbRows = [], request, period, onReload, user }) {
  const currentPeriod = toPeriodValue();
  const [mode, setMode] = useState("view");
  const [searchValue, setSearchValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod);
  const [formState, setFormState] = useState(() => buildEmptyForm(user?.nama || ""));
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [viewAlert, setViewAlert] = useState("");
  const [monthPopoverOpen, setMonthPopoverOpen] = useState(false);
  const monthPopoverRef = useRef(null);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      KASIR: user?.nama || prev.KASIR,
    }));
  }, [user?.nama]);

  const setoranRows = useMemo(() => {
    return (dbRows || [])
      .map((row) => {
        const timestamp = extractTimestamp(row);
        return { timestamp, row };
      })
      .filter((item) => item.timestamp && normalizeArusDana(item.row["ARUS DANA"]) === ARUS_DANA_TARGET);
  }, [dbRows]);

  const monthOptions = useMemo(() => {
    const keys = new Set([currentPeriod]);
    setoranRows.forEach((item) => {
      keys.add(toPeriodValue(item.timestamp));
    });
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [currentPeriod, setoranRows]);

  useEffect(() => {
    if (selectedMonth && monthOptions.includes(selectedMonth)) return;
    if (monthOptions.length) {
      setSelectedMonth(monthOptions[0]);
    } else {
      setSelectedMonth(currentPeriod);
    }
  }, [currentPeriod, monthOptions, selectedMonth]);

  const visibleRows = useMemo(() => {
    if (!selectedMonth) return [];
    return setoranRows
      .filter((item) => toPeriodValue(item.timestamp) === selectedMonth)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item) => sanitizeRow(item.row));
  }, [selectedMonth, setoranRows]);

  const filteredRows = useMemo(() => filterRows(visibleRows, searchValue), [searchValue, visibleRows]);

  useEffect(() => {
    if (!viewAlert) return undefined;
    const timer = setTimeout(() => setViewAlert(""), 4000);
    return () => clearTimeout(timer);
  }, [viewAlert]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (monthPopoverRef.current && !monthPopoverRef.current.contains(event.target)) {
        setMonthPopoverOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    const timestampText = String(formState["TIMESTAMP INPUT"] || "").trim();
    const parsedTimestamp = parseTimestamp(timestampText);
    if (!parsedTimestamp) {
      setFormError("Format timestamp tidak valid.");
      return;
    }
    const nominalValue = Number(formState["UANG KELUAR"]);
    if (!Number.isFinite(nominalValue) || nominalValue <= 0) {
      setFormError("Nominal kas keluar harus lebih besar dari 0.");
      return;
    }

    setSubmitLoading(true);
    try {
      await request({
        action: "create_database",
        data: {
          "TIMESTAMP INPUT": timestampText,
          SHIFT: formState.SHIFT,
          "ARUS DANA": formState["ARUS DANA"],
          KASIR: formState.KASIR,
          KETERANGAN: formState.KETERANGAN,
          "UANG KELUAR": nominalValue,
        },
      });

      const successMessage = "Kas keluar tersimpan.";
      setFormSuccess(successMessage);
      setViewAlert(successMessage);
      setMode("view");
      const targetMonth = toPeriodValue(parsedTimestamp);
      setSelectedMonth(targetMonth);
      if (onReload) {
        await onReload(targetMonth || period);
      }
      setFormState(buildEmptyForm(user?.nama || ""));
    } catch (err) {
      setFormError(mapApiErrorMessage(err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateFormField = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const renderView = () => (
    <div className="space-y-5 bg-white rounded-4xl border border-brand-green/5 shadow-2xl shadow-brand-green/10">

      {viewAlert && <Alert type="success">{viewAlert}</Alert>}

      <div className="relative" ref={monthPopoverRef}>
        <DataTable
          title="Kas Keluar"
          rows={filteredRows}
          search={searchValue}
          onSearchChange={setSearchValue}
          headerActions={
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-green px-3 py-2 text-[10px] font-black uppercase text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-green-dark"
              type="button"
              onClick={() => {
                setMode("input");
                setFormError("");
                setFormSuccess("");
              }}
            >
              <Plus size={14} />
              Input
            </button>
          }
        />
        {monthPopoverOpen && (
          <div className="absolute right-4 top-0 z-20 mt-12 w-48 rounded-2xl border border-brand-green/15 bg-white p-3 shadow-2xl shadow-brand-green-dark/20">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2">Pilih Bulan</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {monthOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-sm font-bold transition ${selectedMonth === option ? "bg-brand-green text-white" : "bg-brand-bg/60 text-brand-green-dark hover:bg-brand-bg/80"}`}
                  onClick={() => {
                    setSelectedMonth(option);
                    setMonthPopoverOpen(false);
                  }}
                >
                  {formatMonthLabel(option)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-5 bg-white rounded-4xl border border-brand-green/5 p-6 shadow-2xl shadow-brand-green/10">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-2xl border border-brand-green/20 px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-green/5 transition"
        onClick={() => setMode("view")}
      >
        <ChevronLeft size={16} />
        Kembali
      </button>

      {formError && <Alert type="error">{formError}</Alert>}
      {formSuccess && <Alert type="success">{formSuccess}</Alert>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted">Timestamp Input</label>
          <input
            type="text"
            className="w-full rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark focus:border-brand-green focus:outline-none"
            value={formState["TIMESTAMP INPUT"]}
            onChange={(event) => updateFormField("TIMESTAMP INPUT", event.target.value)}
            placeholder="Minggu, 1 Maret 2026 22.22.26"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block">Arus Dana</label>
            <CustomSelect
              options={BRANCH_OPTIONS}
              value={formState["ARUS DANA"]}
              onChange={(value) => updateFormField("ARUS DANA", value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block">Shift</label>
            <CustomSelect
              options={SHIFT_OPTIONS}
              value={formState.SHIFT}
              onChange={(value) => updateFormField("SHIFT", value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block">Kasir</label>
            <CustomSelect
              options={KASIR_OPTIONS}
              value={formState.KASIR}
              onChange={(value) => updateFormField("KASIR", value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block">Nominal</label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark focus:border-brand-green focus:outline-none"
              value={formState["UANG KELUAR"]}
              onChange={(event) => updateFormField("UANG KELUAR", event.target.value)}
              placeholder="100000"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.32em] text-brand-muted mb-2 block">Keterangan</label>
            <textarea
              className="w-full rounded-2xl border border-brand-green/20 bg-brand-bg/60 px-4 py-2.5 text-sm font-bold text-brand-green-dark focus:border-brand-green focus:outline-none"
              rows="2"
              value={formState.KETERANGAN}
              onChange={(event) => updateFormField("KETERANGAN", event.target.value)}
              placeholder="Catatan transaksi kas keluar"
            />
          </div>
        </div>

        <div className="flex sm:justify-end">
          <button
            className="inline-flex justify-center items-center gap-2 rounded-2xl bg-brand-yellow px-5 py-3 text-xs font-black uppercase tracking-[0.3em] text-brand-green-dark shadow-lg shadow-brand-yellow/30 transition hover:bg-yellow-400 disabled:opacity-60 w-full sm:w-auto"
            type="submit"
            disabled={submitLoading}
          >
            Simpan Kas Keluar
          </button>
        </div>
      </form>
    </div>
  );

  return mode === "input" ? renderForm() : renderView();
}
