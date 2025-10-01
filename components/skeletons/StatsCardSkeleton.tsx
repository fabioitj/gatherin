import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
        <CardTitle className="text-xs font-medium text-gray-600">
          <Skeleton className="h-3 w-20" />
        </CardTitle>
        <Skeleton className="h-6 w-6 rounded-lg" />
      </CardHeader>
      <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
        <Skeleton className="h-6 sm:h-7 lg:h-8 w-16" />
      </CardContent>
    </Card>
  );
}
