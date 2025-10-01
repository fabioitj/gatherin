import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewsDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/news">
          <Button
            variant="ghost"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para início
          </Button>
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <div className="ml-auto">
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-3/4 mb-6" />

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-32" />
          </div>
        </header>

        {/* Featured Image Skeleton */}
        <Skeleton className="w-full h-64 md:h-96 mb-8 rounded-2xl" />

        {/* Summary Skeleton */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="prose prose-lg max-w-none mb-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Tags Skeleton */}
        <div className="border-t pt-8 mb-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="bg-gray-50 rounded-2xl p-6 border-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
