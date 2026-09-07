import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded bg-ink-100', className)} />;
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-3', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Mimics a Card's line rhythm — a heading bar plus a few body lines — for use in loading.tsx files. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('rounded-lg border border-ink-100 bg-white p-4 shadow-card', className)}>
      <Skeleton className="mb-3 h-3 w-24" />
      <SkeletonText lines={lines} />
    </div>
  );
}
