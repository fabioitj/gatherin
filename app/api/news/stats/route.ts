import { NextResponse } from 'next/server';
import { NewsDAL } from '@/dal/news';

export async function GET() {
  try {
    const stats = await NewsDAL.getNewsStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar estatísticas',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}