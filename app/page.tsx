'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NewsCard } from '@/components/NewsCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { StatsCard } from '@/components/StatsCard';
import { Category, NewsPreview, PaginatedNews } from '@/types/news';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Lazy load components that are not immediately visible
const LazyNewsCard = dynamic(() => import('@/components/NewsCard').then(mod => ({ default: mod.NewsCard })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
});

export default function HomePage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [newsData, setNewsData] = useState<PaginatedNews | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Fetch news data
  const fetchNews = async (page = 1, category?: Category | null, search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`/api/news?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar notícias');
      }
      
      const data = await response.json();
      setNewsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/news/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Fetch favorite IDs for authenticated users
  const fetchFavoriteIds = async (newsIds: string[]) => {
    if (!session?.user || newsIds.length === 0) {
      setFavoriteIds([]);
      return;
    }

    try {
      const response = await fetch(`/api/favorites/check?newsIds=${newsIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setFavoriteIds(data.favoriteIds || []);
      } else {
        console.error('Failed to fetch favorite IDs:', response.status);
        setFavoriteIds([]);
      }
    } catch (err) {
      console.error('Error loading favorite IDs:', err);
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    fetchNews(1, selectedCategory, searchQuery);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch favorite IDs when news data changes and user is authenticated
  useEffect(() => {
    if (newsData?.news && session?.user) {
      const newsIds = newsData.news.map(news => news.id);
      fetchFavoriteIds(newsIds);
    } else {
      setFavoriteIds([]);
    }
  }, [newsData, session]);

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNews(page, selectedCategory, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !newsData) {
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

  if (error && !newsData) {
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

      {/* Stats */}
      {/* {stats && <StatsCard stats={stats} />} */}

      {/* Search and Filters */}
      <div className="mb-8 space-y-6">
        <div className="flex justify-center">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Buscar por título, resumo ou conteúdo..."
            className="w-full max-w-2xl"
          />
        </div>
        
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-0">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </div>
      </div>

      {/* News Grid */}
      {!newsData || newsData.news.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `Não encontramos resultados para "${searchQuery}".`
              : selectedCategory 
                ? `Não há notícias disponíveis para a categoria selecionada.`
                : 'Não há notícias disponíveis no momento.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery 
                ? `Resultados para "${searchQuery}"`
                : selectedCategory 
                  ? `Notícias de ${selectedCategory === Category.ACOES ? 'Ações' : 'FIIs'}`
                  : 'Todas as notícias'
              }
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {newsData.total} notícia{newsData.total !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {newsData.news.map((item, index) => {
              const isFavorited = favoriteIds.includes(item.id);
              
              // Render first 6 cards immediately, lazy load the rest
              if (index < 6) {
                return (
                  <NewsCard 
                    key={item.id} 
                    news={item} 
                    priority={index < 3}
                    isFavorited={isFavorited}
                  />
                );
              }
              
              return (
                <LazyNewsCard 
                  key={item.id} 
                  news={item} 
                  priority={false}
                  isFavorited={isFavorited}
                />
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={newsData.totalPages}
            onPageChange={handlePageChange}
            className="mt-8"
          />
        </>
      )}

      {/* Loading overlay for pagination */}
      {loading && newsData && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
}