import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-9 w-14" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
