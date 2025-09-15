import { prisma } from '@/lib/prisma';
import { Favorite } from '@/types/favorites';

export class FavoritesDAL {
  static async toggleFavorite(userId: string, newsId: string): Promise<{ isFavorited: boolean }> {
    try {
      // Check if favorite already exists
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_newsId: {
            userId,
            newsId
          }
        }
      });

      if (existingFavorite) {
        // Remove favorite
        await prisma.favorite.delete({
          where: {
            id: existingFavorite.id
          }
        });
        return { isFavorited: false };
      } else {
        // Add favorite
        await prisma.favorite.create({
          data: {
            userId,
            newsId
          }
        });
        return { isFavorited: true };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  }

  static async getUserFavorites(userId: string, page = 1, limit = 10) {
    try {
      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId },
          include: {
            news: {
              select: {
                id: true,
                title: true,
                summary: true,
                imageUrl: true,
                source: true,
                publishedAt: true,
                category: true,
                tags: true,
                tickers: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.favorite.count({ where: { userId } })
      ]);

      return {
        favorites,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw new Error('Failed to load favorites');
    }
  }

  static async isFavorited(userId: string, newsId: string): Promise<boolean> {
    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_newsId: {
            userId,
            newsId
          }
        }
      });
      return !!favorite;
    } catch (error) {
      console.error('Error checking if favorited:', error);
      return false;
    }
  }

  static async getUserFavoriteIds(userId: string): Promise<string[]> {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { newsId: true }
      });
      return favorites.map(f => f.newsId);
    } catch (error) {
      console.error('Error fetching favorite IDs:', error);
      return [];
    }
  }

  static async getFavoriteStats(userId: string) {
    try {
      const [total, recentCount] = await Promise.all([
        prisma.favorite.count({ where: { userId } }),
        prisma.favorite.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      return {
        total,
        recentCount
      };
    } catch (error) {
      console.error('Error fetching favorite stats:', error);
      throw new Error('Failed to load favorite stats');
    }
  }
}