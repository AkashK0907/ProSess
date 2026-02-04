import { Skeleton } from "@/components/ui/skeleton";

export function EditSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="space-y-12">
        {/* Subjects Skeleton */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Skeleton className="h-8 w-32" /> {/* Title */}
            <Skeleton className="h-10 w-32 rounded-lg" /> {/* Add Button */}
          </div>

          <div className="surface-card divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                 <Skeleton className="h-5 w-48" />
                 <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* Tasks Skeleton */}
        <section>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Skeleton className="h-8 w-24" /> {/* Title */}
            <Skeleton className="h-10 w-28 rounded-lg" /> {/* Add Button */}
          </div>

          <div className="surface-card divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                 <Skeleton className="h-5 w-48" />
                 <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
