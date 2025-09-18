'use client';

import { Badge } from '@/components/ui/badge';
import { Tag, Building } from 'lucide-react';

interface TagListProps {
  tags?: string[];
  tickers?: string[];
  className?: string;
}

export function TagList({ tags = [], tickers = [], className = '' }: TagListProps) {
  if (tags.length === 0 && tickers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {tags.length > 0 && (
        <div>
          <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 mr-2" />
            Tags relacionadas
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors duration-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {tickers.length > 0 && (
        <div>
          <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 mr-2" />
            Ativos mencionados
          </div>
          <div className="flex flex-wrap gap-2">
            {tickers.map((ticker, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors duration-200 font-mono"
              >
                {ticker}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}