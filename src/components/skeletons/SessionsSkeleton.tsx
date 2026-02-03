import { Skeleton } from "@/components/ui/skeleton";

export function SessionsSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Current Session Timer */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" /> {/* Title */}
        </div>

        <div className="surface-card p-6 md:p-12 relative overflow-hidden flex flex-col items-center">
            {/* Timer Display */}
            <div className="text-center mb-8 flex flex-col items-center w-full">
               <Skeleton className="h-24 w-64 mb-4" /> {/* Timer */}
               <Skeleton className="h-6 w-48" /> {/* Subject */}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-full" />
            </div>
        </div>
      </section>

      {/* Toggles */}
      <section>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-[32px] w-24 rounded-full" />
                <Skeleton className="h-[32px] w-16 rounded-full" />
                <Skeleton className="h-[32px] w-16 rounded-full" />
            </div>
         </div>
      </section>

      {/* Today's Summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-16" />
        </div>

        <div className="surface-card divide-y divide-border/30">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Skeleton className="w-3 h-3 rounded-full" />
                   <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="w-9 h-9 rounded-full" />
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
