import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
    </div>
  );
}
