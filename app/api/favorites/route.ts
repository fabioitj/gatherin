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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await FavoritesDAL.getUserFavorites(session.user.id, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorites API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar favoritos',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newsId } = await request.json();
    
    if (!newsId) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      );
    }

    const result = await FavoritesDAL.toggleFavorite(session.user.id, newsId);
    
    return NextResponse.json({
      success: true,
      isFavorited: result.isFavorited,
      message: result.isFavorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos'
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao alterar favorito',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}