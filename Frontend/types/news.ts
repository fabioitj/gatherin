export enum Category {
  ACOES = 'ACOES',
  FII = 'FII'
}

export interface News {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
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