import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';
import { Category } from '@/types/news';

export async function GET(request: Request) {
  try {
    let category: Category | undefined;

    const news = await NewsDAL.getAllNews();
    
    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    
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
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    let category: Category | undefined;
    if (categoryParam && Object.values(Category).includes(categoryParam as Category)) {
      category = categoryParam as Category;
    }

    const news = await NewsDAL.getAllNews(category);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(news).length.toString(),
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}