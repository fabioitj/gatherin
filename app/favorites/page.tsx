"use client";

import { useEffect, useState } from "react";
import { NewsCard } from "@/components/news-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bookmark } from "lucide-react";

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
  savedAt: string;
  favoriteId: number;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorites
  useEffect(() => {
    async function fetchFavorites() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/users/favorites');
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        const data = await response.json();
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('Failed to load favorites. Please try again later.');
      } finally {
        setLoading(false);
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
        // Remove from UI immediately
        setFavorites((prev) => prev.filter((item) => item.id !== newsId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Favorites</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
      <h1 className="text-3xl font-bold mb-6">Favorites</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {favorites.length === 0 && !error ? (
        <div className="text-center py-12">
          <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground">
            Save news items to find them quickly later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
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
              isFavorite={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}