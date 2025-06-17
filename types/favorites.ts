export interface Favorite {
  id: string;
  userId: string;
  newsId: string;
  createdAt: Date;
  news?: {
    id: string;
    title: string;
    summary: string;
    imageUrl?: string;
    source: string;
    publishedAt: Date;
    category: string;
    tags: string[];
    tickers: string[];
  };
}

export interface FavoriteToggleResponse {
  success: boolean;
  isFavorited: boolean;
  message: string;
}