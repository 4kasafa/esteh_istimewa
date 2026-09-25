import { Skeleton, SkeletonCard, SkeletonText } from "../common/Skeleton";

export function OverviewSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <Skeleton className="h-40 rounded-3xl bg-emerald-950/20">
        <span className="sr-only">Memuat ringkasan</span>
      </Skeleton>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <SkeletonCard className="lg:col-span-2">
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-32 rounded-2xl" />
        </SkeletonCard>
        <SkeletonCard className="flex flex-col items-center justify-center gap-3">
          <Skeleton className="w-36 h-36 rounded-full" />
          <SkeletonText lines={2} className="w-full" />
        </SkeletonCard>
      </div>
      <SkeletonCard>
        <Skeleton className="h-4 w-1/4 mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 w-2/3 mb-1.5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 flex-1 min-w-40 rounded-2xl" />
        <Skeleton className="h-10 w-28 rounded-2xl" />
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="hidden sm:block">
        <SkeletonCard className="!p-0 overflow-hidden">
          <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100/80">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4" />
                ))}
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
      <div className="block sm:hidden space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-2/3 mb-2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-24 rounded-xl" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <SkeletonCard className="space-y-4">
      <div>
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-1/3 mb-1.5" />
            <Skeleton className="h-11 rounded-2xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
    </SkeletonCard>
  );
}

export function MasterPanelSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
