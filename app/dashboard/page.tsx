"use client";

import { useEffect, useState } from "react";
import { NewsCard } from "@/components/news-card";
import { NewsFilter } from "@/components/news-filter";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface News {
  id: number;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  url: string;
  category: string;
  tags: string[];
  country: string;
  sector: string;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  const sector = searchParams.get("sector");
  
  const [news, setNews] = useState<News[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news with filters
  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      
      // Construct URL with query parameters
      let url = '/api/news';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (country) params.append('country', country);
      if (sector) params.append('sector', sector);
      
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNews();
  }, [category, country, sector]);
  
  // Fetch user favorites for comparison
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch('/api/users/favorites');
        if (response.ok) {
          const data = await response.json();
          const favoriteIds = data.map((item: any) => item.id);
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    }
    
    fetchFavorites();
  }, []);
  
  // Handle favorite toggle
  const handleFavoriteToggle = async (newsId: number) => {
    try {
      const response = await fetch('/api/users/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newsId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.favorited) {
          setFavorites((prev) => [...prev, newsId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== newsId));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <NewsFilter />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <NewsFilter />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {news.length === 0 && !error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No news found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              source={item.source}
              publishedAt={new Date(item.publishedAt)}
              summary={item.summary}
              url={item.url}
              category={item.category}
              sector={item.sector}
              country={item.country}
              isFavorite={favorites.includes(item.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}