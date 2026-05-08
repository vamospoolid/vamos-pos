interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={`animate-pulse bg-[#1a1f35] rounded-2xl ${className}`}
          style={{
            animationDelay: `${i * 100}ms`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-4 pt-4">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-2" />
          </div>
        </div>
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>

      {/* Tier Card Skeleton */}
      <Skeleton className="w-full h-48 rounded-[32px]" />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>

      {/* Quests Skeleton */}
      <div className="space-y-4">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-full h-24 rounded-3xl" count={2} />
      </div>

      {/* Featured Events */}
      <div className="space-y-4">
        <Skeleton className="w-40 h-6" />
        <Skeleton className="w-full h-64 rounded-[40px]" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8 px-4 pt-16">
      <div className="text-center space-y-4 mb-12">
        <Skeleton className="w-48 h-10 mx-auto" />
        <Skeleton className="w-32 h-3 mx-auto" />
      </div>
      
      <Skeleton className="w-full h-14 rounded-2xl" />
      
      <div className="flex items-end justify-center gap-4 h-64 pt-20">
        <Skeleton className="w-24 h-32 rounded-t-[32px]" />
        <Skeleton className="w-32 h-48 rounded-t-[40px]" />
        <Skeleton className="w-24 h-24 rounded-t-[32px]" />
      </div>

      <div className="space-y-4 pt-20">
        <Skeleton className="w-full h-24 rounded-[28px]" count={5} />
      </div>
    </div>
  );
}
