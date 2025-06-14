'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { NewsCard } from '@/components/NewsCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category, NewsPreview } from '@/types/news';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Lazy load components that are not immediately visible
const LazyNewsCard = dynamic(() => import('@/components/NewsCard').then(mod => ({ default: mod.NewsCard })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
});

export default function HomePage() {
  const [news, setNews] = useState<NewsPreview[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filtered news to prevent unnecessary re-renders
  const filteredNews = useMemo(() => {
    if (selectedCategory) {
      return news.filter(item => item.category === selectedCategory);
    }
    return news;
  }, [news, selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar notícias');
      }
      
      const data = await response.json();
      setNews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Carregando notícias...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-4">
          GatherIn
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Sua fonte confiável de informações sobre o mercado financeiro brasileiro. 
          Acompanhe as últimas notícias sobre ações e fundos imobiliários.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-0">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-gray-500">
            {selectedCategory 
              ? `Não há notícias disponíveis para a categoria selecionada.`
              : 'Não há notícias disponíveis no momento.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory 
                ? `Notícias de ${selectedCategory === Category.ACOES ? 'Ações' : 'FIIs'}`
                : 'Todas as notícias'
              }
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredNews.length} notícia{filteredNews.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item, index) => {
              // Render first 3 cards immediately, lazy load the rest
              if (index < 3) {
                return (
                  <NewsCard 
                    key={item.id} 
                    news={item} 
                    priority={true}
                  />
                );
              }
              
              return (
                <LazyNewsCard 
                  key={item.id} 
                  news={item} 
                  priority={false}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}