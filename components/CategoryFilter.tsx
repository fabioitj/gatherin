'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Building2, Filter } from 'lucide-react';
import { Category } from '@/types/news';

interface CategoryFilterProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

const categoryConfig = {
  [Category.STOCKS]: {
    label: 'Ações',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 hover:border-purple-300',
    activeColor: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
  },
  [Category.REITS]: {
    label: 'FIIs',
    icon: Building2,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 hover:border-indigo-300',
    activeColor: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
  }
};

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center text-sm font-medium text-gray-700 mr-2">
        <Filter className="w-4 h-4 mr-2" />
        Filtrar por categoria:
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={`transition-all duration-200 ${
          selectedCategory === null
            ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-900'
            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
        }`}
      >
        Todas as notícias
      </Button>

      {Object.entries(categoryConfig).map(([category, config]) => {
        const Icon = config.icon;
        const isActive = selectedCategory === category;
        
        return (
          <Button
            key={category}
            variant="outline"
            size="sm"
            onClick={() => onCategoryChange(category as Category)}
            className={`transition-all duration-200 ${
              isActive ? config.activeColor : config.color
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}