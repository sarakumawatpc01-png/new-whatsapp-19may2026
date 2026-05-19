import { Skeleton } from "@repo/ui";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-4xl space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-2 w-8 rounded-full" />
            <Skeleton className="h-2 w-4 rounded-full" />
            <Skeleton className="h-2 w-4 rounded-full" />
          </div>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-12 w-64 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
