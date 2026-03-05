import { useMemo } from "react";
import { toCurrency } from "../../utils/formatters";

function buildSegments(data) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return [];

  let offset = 0;
  return data.map((item) => {
    const ratio = item.value / total;
    const strokeLength = ratio * 100;
    const segment = {
      ...item,
      strokeLength,
      offset,
    };
    offset += strokeLength;
    return segment;
  });
}

export default function DonutChart({ data }) {
  const segments = useMemo(() => buildSegments(data), [data]);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-44 w-44 sm:h-48 sm:w-48">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#EAF3E2" strokeWidth="12" />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={`${segment.strokeLength} ${100 - segment.strokeLength}`}
              strokeDashoffset={-segment.offset}
              pathLength="100"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Total</p>
          <p className="text-sm font-black text-brand-green-dark">{toCurrency(data.reduce((sum, item) => sum + item.value, 0))}</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-green/20 bg-brand-bg/40 px-4 py-6 text-sm font-bold text-brand-muted">
            Belum ada data kontribusi cabang.
          </div>
        ) : (
          data.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-brand-green/10 bg-brand-bg/40 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="truncate text-xs font-bold text-brand-green-dark">{item.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-brand-green-dark">{item.percent.toFixed(1)}%</p>
                <p className="text-[11px] text-brand-muted font-semibold">{toCurrency(item.value)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
