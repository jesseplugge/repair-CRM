import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <div>
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="flex gap-px overflow-hidden rounded-lg bg-mat-700">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[10.5rem] flex-1 space-y-2 bg-mat p-3 pt-4">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-14 rounded-sm bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
