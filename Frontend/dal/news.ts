import { prisma } from '@/lib/prisma';
import { News, Category } from '@/types/news';

export class NewsDAL {
  static async getAllNews(category?: Category): Promise<News[]> {
    try {
      const whereClause = category ? { category } : {};
      
      const news = await prisma.news.findMany({
        where: whereClause,
        orderBy: {
          publishedAt: 'desc'
        }
      });

      console.log({ news });
      
      return news;
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      throw new Error('Falha ao carregar notícias');
    }
  }

  static async getNewsById(id: string): Promise<News | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('ID inválido');
      }

      const news = await prisma.news.findUnique({
        where: { id }
      });
      
      return news;
    } catch (error) {
      console.error('Erro ao buscar notícia por ID:', error);
      throw new Error('Falha ao carregar notícia');
    }
  }

  static async getNewsByCategory(category: Category): Promise<News[]> {
    try {
      const news = await prisma.news.findMany({
        where: { category },
        orderBy: {
          publishedAt: 'desc'
        }
      });
      
      return news;
    } catch (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      throw new Error('Falha ao carregar notícias por categoria');
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
      console.error('Erro ao buscar últimas notícias:', error);
      throw new Error('Falha ao carregar últimas notícias');
    }
  }
}