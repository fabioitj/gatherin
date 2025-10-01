import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const assetSchema = z.object({
  ticker: z.string().min(1),
  type: z.enum(['STOCK', 'FII']),
  quantity: z.number().int().positive(),
  averagePrice: z.number().positive(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticker, type, quantity, averagePrice } = assetSchema.parse(body);

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        assets: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const existingAsset = wallet.assets.find(
      (asset) => asset.ticker.toUpperCase() === ticker.toUpperCase()
    );

    if (existingAsset) {
      return NextResponse.json(
        { error: 'Este ativo já foi adicionado à carteira.' },
        { status: 400 }
      );
    }

    const newAsset = await prisma.asset.create({
      data: {
        walletId: wallet.id,
        ticker,
        type,
        quantity,
        averagePrice,
      },
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
