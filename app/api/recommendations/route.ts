import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseAsset = searchParams.get('baseAsset');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.1');

    let recommendations;

    if (baseAsset) {
      // Get recommendations for a specific asset
      recommendations = await prisma.assetRecommendation.findMany({
        where: {
          baseAsset: baseAsset.toUpperCase(),
          confidence: {
            gte: minConfidence
          }
        },
        orderBy: {
          recommendationStrength: 'desc'
        },
        take: limit
      });
    } else {
      // Get top recommendations overall
      recommendations = await prisma.assetRecommendation.findMany({
        where: {
          confidence: {
            gte: minConfidence
          }
        },
        orderBy: {
          recommendationStrength: 'desc'
        },
        take: limit
      });
    }

    // Format the response with user-friendly messages
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.id,
      baseAsset: rec.baseAsset,
      recommendedAsset: rec.recommendedAsset,
      similarityScore: rec.similarityScore,
      support: rec.support,
      confidence: rec.confidence,
      usersWithBoth: rec.usersWithBoth,
      usersWithBase: rec.usersWithBase,
      percentageAlsoInvest: rec.percentageAlsoInvest,
      recommendationStrength: rec.recommendationStrength,
      message: `${rec.percentageAlsoInvest.toFixed(1)}% dos usuários que investem em ${rec.baseAsset} também investem em ${rec.recommendedAsset}`,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt
    }));

    return NextResponse.json({
      recommendations: formattedRecommendations,
      total: formattedRecommendations.length,
      baseAsset: baseAsset || null,
      filters: {
        limit,
        minConfidence
      }
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar recomendações',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendations } = body;

    if (!Array.isArray(recommendations)) {
      return NextResponse.json(
        { error: 'Recommendations must be an array' },
        { status: 400 }
      );
    }

    // Clear existing recommendations
    await prisma.assetRecommendation.deleteMany();

    // Insert new recommendations
    const createdRecommendations = await prisma.assetRecommendation.createMany({
      data: recommendations.map((rec: any) => ({
        baseAsset: rec.base_asset,
        recommendedAsset: rec.recommended_asset,
        similarityScore: rec.similarity_score,
        support: rec.support,
        confidence: rec.confidence,
        usersWithBoth: rec.users_with_both,
        usersWithBase: rec.users_with_base,
        percentageAlsoInvest: rec.percentage_also_invest,
        recommendationStrength: rec.recommendation_strength
      }))
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendations saved successfully',
      count: createdRecommendations.count
    });
  } catch (error) {
    console.error('Save recommendations error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao salvar recomendações',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}