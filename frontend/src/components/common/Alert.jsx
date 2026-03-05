export default function Alert({ type = "info", children }) {
  if (!children) return null;
  const className =
    type === "error"
      ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
      : type === "success"
        ? "rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
        : "rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700";

  return <div className={className}>{children}</div>;
}
