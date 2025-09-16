import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AssetType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'STOCK';
  const search = searchParams.get('search') || '';

  try {
    // Map frontend type to database enum
    const dbType: AssetType = type === 'STOCK' ? 'STOCK' : 'FII';
    
    // Build search conditions
    const where: any = {
      type: dbType,
      isActive: true
    };

    // Add search filter if provided
    if (search && search.length >= 2) {
      where.OR = [
        {
          ticker: {
            contains: search.toUpperCase(),
            mode: 'insensitive'
          }
        },
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Fetch assets from local database
    const assets = await prisma.assetData.findMany({
      where,
      orderBy: [
        {
          ticker: 'asc'
        }
      ],
      take: 50, // Limit results for performance
      select: {
        ticker: true,
        name: true,
        type: true,
        sector: true,
        logoUrl: true,
        currentPrice: true,
        change: true,
        volume: true,
        marketCap: true,
        lastUpdated: true
      }
    });

    // Format response to match Brapi structure for compatibility
    const formattedAssets = assets.map(asset => ({
      stock: asset.ticker,
      name: asset.name,
      close: asset.currentPrice ? parseFloat(asset.currentPrice.toString()) : undefined,
      change: asset.change ? parseFloat(asset.change.toString()) : undefined,
      volume: asset.volume ? parseInt(asset.volume.toString()) : undefined,
      market_cap: asset.marketCap ? parseInt(asset.marketCap.toString()) : undefined,
      logo: asset.logoUrl,
      sector: asset.sector,
      type: asset.type,
      lastUpdated: asset.lastUpdated
    }));

    return NextResponse.json({
      stocks: formattedAssets,
      totalCount: formattedAssets.length,
      hasNextPage: false,
      currentPage: 1,
      totalPages: 1,
      source: 'local_cache',
      lastUpdated: assets[0]?.lastUpdated || new Date()
    });
  } catch (error) {
    console.error('Local asset search error:', error);
    
    // Fallback to Brapi if local cache fails
    console.log('Falling back to Brapi API...');
    
    try {
      const apiType = type === 'STOCK' ? 'stock' : 'fund';
      let url = `https://brapi.dev/api/quote/list?type=${apiType}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer 8rDscDtqiTXKAGB1kfbn42`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Brapi API returned ${response.status}`);
      }

      const data = await response.json();
      
      return NextResponse.json({
        stocks: data.stocks || [],
        totalCount: data.totalCount || 0,
        hasNextPage: data.hasNextPage || false,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        source: 'brapi_fallback'
      });
    } catch (fallbackError) {
      console.error('Brapi fallback also failed:', fallbackError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch assets from both local cache and Brapi',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
      );
    }
  }
}