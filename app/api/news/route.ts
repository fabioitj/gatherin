import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';
import { Category } from '@/types/news';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') as Category;
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

    const filters = {
      category,
      search,
      dateFrom,
      dateTo
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined || filters[key as keyof typeof filters] === null) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await NewsDAL.getAllNews(Object.keys(filters).length > 0 ? filters : undefined, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('News API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar notícias',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function HEAD(request: Request) {
  try {
    await NewsDAL.getLatestNews(1);
    
    return new NextResponse(null, {
      status: 200,
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
    });
  }
}