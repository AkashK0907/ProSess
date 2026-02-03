import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Session Stats Header */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton className="h-8 w-48" /> {/* Title */}
          <div className="flex gap-2">
            <Skeleton className="h-[44px] w-20 rounded-full" />
            <Skeleton className="h-[44px] w-20 rounded-full" />
            <Skeleton className="h-[44px] w-24 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="md:col-span-2 surface-card p-4 md:p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            {/* Bars Placeholder */}
            <div className="flex items-end justify-between h-[200px] gap-2 px-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="w-full rounded-t-lg" 
                  style={{ height: `${Math.random() * 60 + 20}%` }} 
                />
              ))}
            </div>
          </div>

          {/* Pie Chart Area */}
          <div className="surface-card p-4 md:p-6 space-y-4">
             <Skeleton className="h-4 w-32 mb-4" />
             <div className="flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
             </div>
             <div className="space-y-2 mt-4">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <Skeleton className="h-2 w-2 rounded-full" />
                   <Skeleton className="h-3 w-24" />
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Task Stats */}
      <section>
        <Skeleton className="h-8 w-64 mb-6" /> {/* Section Title */}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="surface-card p-6 space-y-6">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div>
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>

          {/* Task List Card */}
          <div className="surface-card p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-1.5 w-1.5 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Donut Card */}
          <div className="surface-card p-6 flex flex-col items-center">
            <Skeleton className="h-4 w-32 self-start mb-4" />
            <div className="relative">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
