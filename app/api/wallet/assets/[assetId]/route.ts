import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateAssetSchema = z.object({
  quantity: z.number().int().positive().optional(),
  averagePrice: z.number().positive().optional(),
});

export async function PUT(req: Request, { params }: { params: { assetId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quantity, averagePrice } = updateAssetSchema.parse(body);
    const { assetId } = params;

    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      include: {
        wallet: true,
      },
    });

    if (!asset || asset.wallet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const updatedAsset = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        quantity,
        averagePrice,
      },
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { assetId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { assetId } = params;

    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      include: {
        wallet: true,
      },
    });

    if (!asset || asset.wallet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    await prisma.asset.delete({
      where: {
        id: assetId,
      },
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
