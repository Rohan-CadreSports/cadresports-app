import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="bg-dark py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-6 w-48 bg-white/10" />
          <Skeleton className="h-12 w-80 bg-white/10" />
          <Skeleton className="h-5 w-64 bg-white/10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10 w-full space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
