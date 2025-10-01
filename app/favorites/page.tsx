'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { NewsCard } from '@/components/NewsCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Favorite } from '@/types/favorites';
import { NewsCardSkeleton } from '@/components/skeletons/NewsCardSkeleton';

interface FavoritesResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favoritesData, setFavoritesData] = useState<FavoritesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login?callbackUrl=/favorites');
      return;
    }
  }, [session, status, router]);

  // Fetch favorites data
  const fetchFavorites = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/favorites?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar favoritos');
      }
      
      const data = await response.json();
      setFavoritesData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchFavorites(1);
      setCurrentPage(1);
    }
  }, [session]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchFavorites(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Don't render anything if not authenticated (will redirect)
  if (status === 'loading' || !session?.user) {
    return null;
  }

  const showSkeletons = loading && !favoritesData;

  if (error && !favoritesData) {
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
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/news">
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para início
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-4">
          Meus Favoritos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Suas notícias favoritas salvas para leitura posterior.
        </p>
      </div>

      {/* Favorites Grid */}
      {showSkeletons ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : !favoritesData || favoritesData.favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Heart className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhum favorito encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Você ainda não favoritou nenhuma notícia. Explore as notícias e salve suas favoritas!
          </p>
          <Link href="/news">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              Explorar notícias
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Suas notícias favoritas
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {favoritesData.total} favorito{favoritesData.total !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {favoritesData.favorites.map((favorite) => (
              <NewsCard 
                key={favorite.id} 
                news={{
                  id: favorite.news!.id,
                  title: favorite.news!.title,
                  summary: favorite.news!.summary,
                  imageUrl: favorite.news!.imageUrl,
                  source: favorite.news!.source,
                  publishedAt: favorite.news!.publishedAt,
                  category: favorite.news!.category as any,
                  tags: favorite.news!.tags,
                  tickers: favorite.news!.tickers
                }}
                isFavorited={true}
                priority={false}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={favoritesData.totalPages}
            onPageChange={handlePageChange}
            className="mt-8"
          />
        </>
      )}

      {/* Loading overlay for pagination */}
      {loading && favoritesData && (
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