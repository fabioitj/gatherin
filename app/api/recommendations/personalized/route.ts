import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssetType } from '@prisma/client';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.1');

    // Get user's wallet assets
    const userWallet = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        assets: {
          select: {
            ticker: true,
          },
        },
      },
    });

    const userAssets = userWallet?.assets.map(asset => asset.ticker) || [];

    if (userAssets.length === 0) {
      return NextResponse.json({
        recommendations: [],
        total: 0,
        userAssets: [],
        filters: {
          limit,
          minConfidence
        }
      });
    }

    // Get recommendations based on user's assets
    const recommendations = await prisma.assetRecommendation.findMany({
      where: {
        baseAsset: {
          in: userAssets
        },
        recommendedAsset: {
          notIn: userAssets // Don't recommend assets they already have
        },
        confidence: {
          gte: minConfidence
        }
      },
      orderBy: {
        recommendationStrength: 'desc'
      },
      take: limit
    });

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
      userAssets,
      filters: {
        limit,
        minConfidence
      }
    });
  } catch (error) {
    console.error('Personalized recommendations API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar recomendações personalizadas',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}