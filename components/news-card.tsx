"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NewsCardProps {
  id: number;
  title: string;
  source: string;
  publishedAt: Date;
  summary: string;
  url: string;
  category: string;
  sector: string;
  country: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
}

export function NewsCard({
  id,
  title,
  source,
  publishedAt,
  summary,
  url,
  category,
  sector,
  country,
  isFavorite = false,
  onFavoriteToggle,
}: NewsCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async () => {
    if (!onFavoriteToggle) return;
    
    setIsLoading(true);
    try {
      await onFavoriteToggle(id);
      setFavorite(!favorite);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge variant="outline" className="mr-1">
              {category}
            </Badge>
            <Badge variant="outline" className="mr-1">
              {sector}
            </Badge>
            <Badge variant="outline">
              {country}
            </Badge>
          </div>
          {onFavoriteToggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    className={favorite ? "text-primary" : "text-muted-foreground"}
                  >
                    <BookmarkIcon className="h-5 w-5" fill={favorite ? "currentColor" : "none"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{favorite ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Link href={`/news/${id}`} className="group">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </Link>
        <CardDescription>
          {source} • {formatDate(publishedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {summary}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Link href={`/news/${id}`}>
          <Button variant="link" className="p-0 h-auto">
            Read more
          </Button>
        </Link>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}