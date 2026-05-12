import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted rounded-[10px]", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[10px] bg-surface border border-border-light p-5 shadow-[var(--shadow-xs)] space-y-3">
      <Skeleton className="h-5 w-2/3 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
      <Skeleton className="h-3 w-1/3 rounded-lg" />
    </div>
  );
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48 rounded-[8px]" />
      <Skeleton className="h-4 w-64 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-[10px]" />
        <Skeleton className="h-20 rounded-[10px]" />
        <Skeleton className="h-20 rounded-[10px]" />
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-[8px]" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-28 rounded-[10px]" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-[10px]" />
        <Skeleton className="h-20 rounded-[10px]" />
        <Skeleton className="h-20 rounded-[10px]" />
      </div>
      <Skeleton className="h-6 w-32 rounded-lg" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
