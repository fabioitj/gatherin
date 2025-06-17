import { prisma } from '@/lib/prisma';
import { News, Category, NewsFilters, PaginatedNews } from '@/types/news';

export class NewsDAL {
  static async getAllNews(filters?: NewsFilters, page = 1, limit = 10): Promise<PaginatedNews> {
    try {
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { summary: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        where.publishedAt = {};
        if (filters.dateFrom) {
          where.publishedAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.publishedAt.lte = filters.dateTo;
        }
      }

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: {
            publishedAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.news.count({ where })
      ]);
      
      return {
        news,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to load news');
    }
  }

  static async getNewsById(id: string): Promise<News | null> {
    try {
      const news = await prisma.news.findUnique({
        where: { id }
      });
      
      return news;
    } catch (error) {
      console.error('Error fetching news by ID:', error);
      throw new Error('Failed to load news');
    }
  }

  static async getNewsByCategory(category: Category, page = 1, limit = 10): Promise<PaginatedNews> {
    try {
      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where: { category },
          orderBy: {
            publishedAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.news.count({ where: { category } })
      ]);
      
      return {
        news,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching news by category:', error);
      throw new Error('Failed to load news by category');
    }
  }

  static async getLatestNews(limit: number = 10): Promise<News[]> {
    try {
      const news = await prisma.news.findMany({
        take: limit,
        orderBy: {
          publishedAt: 'desc'
        }
      });
      
      return news;
    } catch (error) {
      console.error('Error fetching latest news:', error);
      throw new Error('Failed to load latest news');
    }
  }

  static async searchNews(query: string, page = 1, limit = 10): Promise<PaginatedNews> {
    try {
      const where = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      };

      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: {
            publishedAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.news.count({ where })
      ]);
      
      return {
        news,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error searching news:', error);
      throw new Error('Failed to search news');
    }
  }

  static async getNewsStats(): Promise<{
    total: number;
    byCategory: Record<Category, number>;
    recentCount: number;
  }> {
    try {
      const [total, stocks, reits, recent] = await Promise.all([
        prisma.news.count(),
        prisma.news.count({ where: { category: Category.STOCKS } }),
        prisma.news.count({ where: { category: Category.REITS } }),
        prisma.news.count({
          where: {
            publishedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      return {
        total,
        byCategory: {
          [Category.STOCKS]: stocks,
          [Category.REITS]: reits
        },
        recentCount: recent
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to load stats');
    }
  }
}