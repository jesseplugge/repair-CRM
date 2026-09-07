import { Skeleton } from '@/components/ui/skeleton';

export default function ReparatiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="rounded-lg border border-ink-100 bg-white shadow-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-ink-100 px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
