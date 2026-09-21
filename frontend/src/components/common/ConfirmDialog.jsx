export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya",
  cancelLabel = "Tidak",
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-green-dark/35 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-3xl border border-brand-green/10 bg-white p-6 shadow-2xl shadow-brand-green/10">
        <h3 className="text-lg font-black tracking-tight text-brand-green-dark">{title}</h3>
        <p className="mt-2 text-sm text-brand-muted">{description}</p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            className="rounded-xl border border-brand-green/15 bg-white px-4 py-2.5 text-sm font-black text-brand-green-dark hover:bg-brand-bg"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60 transition-colors ${
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-brand-green hover:bg-brand-green-dark"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
