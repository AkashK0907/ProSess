import { Skeleton } from "@/components/ui/skeleton";

export function TrackerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Consistency Chart Skeleton */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton className="h-8 w-32" /> {/* Title */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 md:h-8 md:w-8 rounded-md" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-10 md:h-8 md:w-8 rounded-md" />
          </div>
        </div>

        <div className="surface-card p-4 md:p-6">
           <Skeleton className="w-full h-[200px]" />
        </div>
      </section>

      {/* Weekly Tracker Skeleton */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
           <Skeleton className="h-8 w-40" /> {/* Title */}
           
           <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center bg-secondary/50 rounded-lg p-1 gap-2">
                 <Skeleton className="h-8 w-8 rounded-md" />
                 <Skeleton className="h-5 w-32" />
                 <Skeleton className="h-8 w-8 rounded-md" />
              </div>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
           {/* Tracker Grid Skeleton */}
           <div className="flex-1 surface-card p-4 md:p-6">
              {/* Date Header */}
              <div className="flex justify-between mb-4">
                 {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                       <Skeleton className="h-4 w-8" />
                       <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                 ))}
              </div>
              
              {/* Task Rows */}
              <div className="space-y-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                       <Skeleton className="h-5 w-32" />
                       <div className="flex gap-2">
                           {[...Array(7)].map((_, j) => (
                              <Skeleton key={j} className="h-6 w-6 rounded-full" />
                           ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Summary Cards Skeleton */}
           <div className="w-full md:w-48 grid grid-cols-2 md:grid-cols-1 gap-4">
              <div className="glass-card p-5">
                 <Skeleton className="h-10 w-16 mx-auto mb-2" />
                 <Skeleton className="h-3 w-20 mx-auto" />
              </div>
              <div className="glass-card p-5">
                 <Skeleton className="h-10 w-16 mx-auto mb-2" />
                 <Skeleton className="h-3 w-12 mx-auto" />
              </div>
               <div className="glass-card p-5 col-span-2 md:col-span-1">
                 <Skeleton className="h-10 w-16 mx-auto mb-2" />
                 <Skeleton className="h-3 w-24 mx-auto" />
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
