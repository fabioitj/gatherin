"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, BookmarkIcon, ExternalLink } from "lucide-react";

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

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = Number(params.id);
  
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Fetch news details
  useEffect(() => {
    async function fetchNewsDetails() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/news/${newsId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('News item not found');
          }
          throw new Error('Failed to load news details');
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error('Error fetching news details:', error);
        setError((error as Error).message || 'Failed to load news details');
      } finally {
        setLoading(false);
      }
    }
    
    // Check if news is in favorites
    async function checkFavorite() {
      try {
        const response = await fetch('/api/users/favorites');
        if (response.ok) {
          const data = await response.json();
          const isFavorite = data.some((item: any) => item.id === newsId);
          setFavorite(isFavorite);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
    
    if (newsId) {
      fetchNewsDetails();
      checkFavorite();
    }
  }, [newsId]);
  
  // Toggle favorite status
  const handleFavoriteToggle = async () => {
    setFavoriteLoading(true);
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
        setFavorite(result.favorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!news) {
    return null;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">{news.category}</Badge>
          <Badge variant="outline">{news.sector}</Badge>
          <Badge variant="outline">{news.country}</Badge>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{news.title}</h1>
        
        <div className="flex items-center justify-between text-muted-foreground mb-6">
          <p>
            {news.source} • {formatDate(new Date(news.publishedAt))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={favorite ? "text-primary" : ""}
            >
              <BookmarkIcon className="mr-2 h-4 w-4" fill={favorite ? "currentColor" : "none"} />
              {favorite ? "Saved" : "Save"}
            </Button>
            <a href={news.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Source
              </Button>
            </a>
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-line">{news.summary}</p>
            
            {news.tags && news.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <h2 className="text-xl font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {news.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}