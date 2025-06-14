'use client';

import { useState, useEffect } from 'react';
import { NewsCard } from '@/components/NewsCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Category, NewsPreview } from '@/types/news';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewsPage() {
  const [news, setNews] = useState<NewsPreview[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsPreview[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredNews(news.filter(item => item.category === selectedCategory));
    } else {
      setFilteredNews(news);
    }
  }, [news, selectedCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Failed to load news');
      }
      
      const data = await response.json();
      setNews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
            <p className="text-gray-600">Loading news...</p>
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
            {error}. Please try refreshing the page.
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
          Financial News
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your reliable source of information about the Brazilian financial market. 
          Follow the latest news about stocks and real estate investment funds.
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
            No news found
          </h3>
          <p className="text-gray-500">
            {selectedCategory 
              ? `There are no news available for the selected category.`
              : 'There are no news available at the moment.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory 
                ? `${selectedCategory === Category.ACOES ? 'Stocks' : 'REITs'} News`
                : 'All News'
              }
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <NewsCard key={item.id} news={item} linkPrefix="/news" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}