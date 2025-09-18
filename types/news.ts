import { Category } from "@prisma/client";

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string | null;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  category: Category;
  tags: string[];
  tickers: string[];
}

export type NewsPreview = Pick<News, 
  'id' | 'title' | 'summary' | 'imageUrl' | 'source' | 'publishedAt' | 'category' | 'tags' | 'tickers'
>;

export interface NewsFilters {
  category?: Category;
  search?: string | null;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  tickers?: string[];
}

export interface PaginatedNews {
  news: NewsPreview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}