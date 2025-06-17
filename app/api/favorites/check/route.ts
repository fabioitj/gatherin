import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FavoritesDAL } from '@/dal/favorites';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const newsIds = searchParams.get('newsIds')?.split(',') || [];
    
    if (newsIds.length === 0) {
      return NextResponse.json({ favoriteIds: [] });
    }

    const userFavoriteIds = await FavoritesDAL.getUserFavoriteIds(session.user.id);
    const favoriteIds = newsIds.filter(id => userFavoriteIds.includes(id));
    
    return NextResponse.json({ favoriteIds });
  } catch (error) {
    console.error('Check favorites error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao verificar favoritos',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}