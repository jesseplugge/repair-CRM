import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function ReparatieDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-5">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
        <div className="col-span-4 space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </div>
  );
}
