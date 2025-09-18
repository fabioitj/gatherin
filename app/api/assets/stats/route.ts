import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalAssets,
      stocksCount,
      fiisCount,
      lastUpdate,
      topSectors,
      recentlyUpdated
    ] = await Promise.all([
      // Total assets count
      prisma.assetData.count({
        where: { isActive: true }
      }),
      
      // Stocks count
      prisma.assetData.count({
        where: { 
          type: 'STOCK',
          isActive: true 
        }
      }),
      
      // FIIs count
      prisma.assetData.count({
        where: { 
          type: 'FII',
          isActive: true 
        }
      }),
      
      // Last update timestamp
      prisma.assetData.findFirst({
        where: { isActive: true },
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true }
      }),
      
      // Top sectors
      prisma.$queryRaw`
        SELECT sector, COUNT(*) as count
        FROM asset_data
        WHERE "isActive" = true AND sector IS NOT NULL
        GROUP BY sector
        ORDER BY count DESC
        LIMIT 10
      `,
      
      // Recently updated assets
      prisma.assetData.count({
        where: {
          isActive: true,
          lastUpdated: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return NextResponse.json({
      totalAssets,
      stocksCount,
      fiisCount,
      lastUpdate: lastUpdate?.lastUpdated,
      topSectors,
      recentlyUpdated,
      cacheHealth: {
        isHealthy: recentlyUpdated > 0,
        lastUpdateAge: lastUpdate?.lastUpdated 
          ? Math.floor((Date.now() - new Date(lastUpdate.lastUpdated).getTime()) / (1000 * 60 * 60))
          : null
      }
    });
  } catch (error) {
    console.error('Asset stats API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar estatísticas de ativos',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}