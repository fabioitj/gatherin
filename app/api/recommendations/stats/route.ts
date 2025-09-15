import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalRecommendations,
      topRecommendations,
      avgSimilarityScore,
      avgConfidence,
      mostRecommendedAssets
    ] = await Promise.all([
      // Total recommendations count
      prisma.assetRecommendation.count(),
      
      // Top 5 recommendations by strength
      prisma.assetRecommendation.findMany({
        orderBy: {
          recommendationStrength: 'desc'
        },
        take: 5,
        select: {
          baseAsset: true,
          recommendedAsset: true,
          percentageAlsoInvest: true,
          recommendationStrength: true
        }
      }),
      
      // Average similarity score
      prisma.assetRecommendation.aggregate({
        _avg: {
          similarityScore: true
        }
      }),
      
      // Average confidence
      prisma.assetRecommendation.aggregate({
        _avg: {
          confidence: true
        }
      }),
      
      // Most recommended assets (assets that appear most as recommendations)
      prisma.$queryRaw`
        SELECT "recommendedAsset", COUNT(*) as recommendation_count
        FROM "asset_recommendations"
        GROUP BY "recommendedAsset"
        ORDER BY recommendation_count DESC
        LIMIT 10
      `
    ]);

    return NextResponse.json({
      totalRecommendations,
      topRecommendations: topRecommendations.map(rec => ({
        ...rec,
        message: `${rec.percentageAlsoInvest.toFixed(1)}% dos usuários que investem em ${rec.baseAsset} também investem em ${rec.recommendedAsset}`
      })),
      averages: {
        similarityScore: avgSimilarityScore._avg.similarityScore || 0,
        confidence: avgConfidence._avg.confidence || 0
      },
      mostRecommendedAssets,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations stats API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar estatísticas de recomendações',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}