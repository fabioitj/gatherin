import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletAssetSkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-5 w-12 rounded-full" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-5 w-12 ml-auto" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-5 w-20 ml-auto" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-5 w-20 ml-auto" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-5 w-24 ml-auto" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-5 w-20 ml-auto" />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </td>
    </tr>
  );
}

export function WalletAssetSkeletonCard() {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
