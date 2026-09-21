import { toCurrency } from "../../utils/formatters";

export default function BarChart({ title, data, color = "#2B9348", stretch = false }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={`${stretch ? "h-full flex flex-col" : ""} space-y-3 xl:overflow-y-auto no-scrollbar`}>
      {title ? <h4 className="text-sm font-black uppercase tracking-wider text-brand-muted">{title}</h4> : null}

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-green/20 bg-brand-bg/40 px-4 py-8 text-center text-sm font-bold text-brand-muted">
          Belum ada data chart.
        </div>
      ) : (
        <div className={`${stretch ? "flex-1" : ""} space-y-3`}>
          {data.map((item) => (
            <div key={item.label} className="rounded-xl border border-brand-green/10 bg-brand-bg/35 px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-black text-brand-green-dark">{item.label}</span>
                <strong className="text-xs font-black text-brand-green-dark">{toCurrency(item.value)}</strong>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-bg">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
