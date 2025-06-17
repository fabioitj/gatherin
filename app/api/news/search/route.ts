import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const result = await NewsDAL.searchNews(query, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na API de busca:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao buscar notícias',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}