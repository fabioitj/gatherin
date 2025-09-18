'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category } from '@prisma/client';
import { TrendingUp, Building2, Clock, BarChart3 } from 'lucide-react';

interface StatsCardProps {
  stats: {
    total: number;
    byCategory: Record<Category, number>;
    recentCount: number;
  };
}

export function StatsCard({ stats }: StatsCardProps) {
  const statsItems = [
    {
      title: 'Total de Notícias',
      value: stats.total,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Notícias de Ações',
      value: stats.byCategory[Category.ACOES],
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Notícias de FIIs',
      value: stats.byCategory[Category.FII],
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Últimas 24h',
      value: stats.recentCount,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statsItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {item.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}