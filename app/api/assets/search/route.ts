import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'stock';
  const search = searchParams.get('search') || '';

  console.log("aqui")

  try {
    const response = await fetch(`https://brapi.dev/api/quote/list?type=${type}&search=${search}`, {
      headers: {
        'Authorization': `Bearer 8rDscDtqiTXKAGB1kfbn42`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assets from Brapi');
    }

    const data = await response.json();
    return NextResponse.json(data.stocks || data.funds);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}
