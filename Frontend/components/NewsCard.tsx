'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ExternalLink, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsPreview, Category } from '@/types/news';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsCardProps {
  news: NewsPreview;
  linkPrefix?: string; // Add option to customize link prefix
}

const categoryLabels = {
  [Category.ACOES]: 'Ações',
  [Category.FII]: 'FIIs'
};

const categoryColors = {
  [Category.ACOES]: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  [Category.FII]: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
};

export function NewsCard({ news, linkPrefix = '/noticia' }: NewsCardProps) {
  const formattedDate = format(new Date(news.publishedAt), "dd 'de' MMMM, yyyy", {
    locale: ptBR
  });

  return (
    <Card className="group h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      {news.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <Image
            src={news.imageUrl}
            alt={news.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary" 
            className={`${categoryColors[news.category]} font-medium px-3 py-1 transition-colors duration-200`}
          >
            {categoryLabels[news.category]}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <h3 className="text-lg font-bold leading-tight text-gray-900 group-hover:text-purple-700 transition-colors duration-200 line-clamp-2">
          {news.title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
          {news.summary}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <ExternalLink className="w-3 h-3 mr-1" />
            {news.source}
          </span>
          
          {news.tags.length > 0 && (
            <div className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              <span>{news.tags.length} tag{news.tags.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`${linkPrefix}/${news.id}`} className="w-full">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Leia mais
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}