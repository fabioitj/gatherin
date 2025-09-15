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
      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
