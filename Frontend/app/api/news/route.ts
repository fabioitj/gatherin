import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';

export async function GET(request: Request) {
  try {
    const news = await NewsDAL.getAllNews();
    
    return NextResponse.json(news);
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
    const news = await NewsDAL.getAllNews();
    
    return new NextResponse(null, {
      status: 200,
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
    });
  }
}