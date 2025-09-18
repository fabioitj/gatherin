import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        assets: true,
      },
    });

    if (!wallet) {
      // If wallet doesn't exist, create one
      const newWallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
        },
        include: {
          assets: true,
        },
      });
      return NextResponse.json({
        ...newWallet,
        assets: [],
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0
      });
    }

    // Get current prices for all assets
    const tickers = wallet.assets.map(asset => asset.ticker);
    const currentPrices = await getCurrentPrices(tickers);
    
    // Calculate gains/losses for each asset
    const assetsWithGainLoss = wallet.assets.map(asset => {
      const currentPrice = currentPrices[asset.ticker] || 0;
      const totalInvested = asset.quantity * asset.averagePrice;
      const currentValue = asset.quantity * currentPrice;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
      
      return {
        ...asset,
        currentPrice,
        currentValue,
        totalInvested,
        gainLoss,
        gainLossPercentage
      };
    });
    
    // Calculate total portfolio metrics
    const totalInvested = assetsWithGainLoss.reduce((sum, asset) => sum + asset.totalInvested, 0);
    const totalCurrentValue = assetsWithGainLoss.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    return NextResponse.json({
      ...wallet,
      assets: assetsWithGainLoss,
      totalValue: totalCurrentValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getCurrentPrices(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};
  
  try {
    // Get current prices from our asset_data table
    const assets = await prisma.assetData.findMany({
      where: {
        ticker: {
          in: tickers
        },
        isActive: true
      },
      select: {
        ticker: true,
        currentPrice: true
      }
    });
    
    const prices: Record<string, number> = {};
    assets.forEach(asset => {
      if (asset.currentPrice) {
        prices[asset.ticker] = parseFloat(asset.currentPrice.toString());
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching current prices:', error);
    return {};
  }
}