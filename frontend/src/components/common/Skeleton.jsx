export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`bg-gray-200/80 dark:bg-gray-300/40 rounded-xl animate-pulse ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className = "", gap = "gap-2" }) {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-gray-100/80 bg-white/70 p-4 sm:p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
