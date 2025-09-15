import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'stock';
  const search = searchParams.get('search') || '';

  try {
    // Use the correct Brapi endpoint for searching assets
    let url = '';
    if (type === 'stock') {
      url = `https://brapi.dev/api/quote/list?search=${encodeURIComponent(search)}&limit=20`;
    } else {
      // For FIIs, we need to use a different approach since Brapi doesn't have a dedicated FII search
      url = `https://brapi.dev/api/quote/list?search=${encodeURIComponent(search)}&limit=20`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer 8rDscDtqiTXKAGB1kfbn42`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Brapi API error:', response.status, response.statusText);
      throw new Error(`Brapi API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Filter results based on type
    let filteredResults = data.stocks || [];
    
    if (type === 'fund') {
      // Filter for FIIs (usually end with 11)
      filteredResults = filteredResults.filter((asset: any) => 
        asset.stock && asset.stock.endsWith('11')
      );
    } else {
      // Filter for stocks (exclude FIIs)
      filteredResults = filteredResults.filter((asset: any) => 
        asset.stock && !asset.stock.endsWith('11')
      );
    }

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error('Brapi integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets from Brapi' }, 
      { status: 500 }
    );
  }
}