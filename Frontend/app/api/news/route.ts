import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';

export async function GET(request: Request) {
  try {
    const news = await NewsDAL.getAllNews();
    
    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'Content-Type': 'application/json; charset=utf-8',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar notícias',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}

export async function HEAD(request: Request) {
  try {
    const news = await NewsDAL.getAllNews();
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': JSON.stringify(news).length.toString(),
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}