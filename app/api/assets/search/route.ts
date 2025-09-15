import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'stock';
  const search = searchParams.get('search') || '';

  try {
    // Use the correct Brapi endpoint based on type
    const apiType = type === 'STOCK' ? 'stock' : 'fund';
    let url = `https://brapi.dev/api/quote/list?type=${apiType}`;
    
    // Add search parameter if provided
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
      console.error('Brapi API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Brapi API error response:', errorText);
      throw new Error(`Brapi API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return the stocks array from the response
    return NextResponse.json({
      stocks: data.stocks || [],
      totalCount: data.totalCount || 0,
      hasNextPage: data.hasNextPage || false,
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1
    });
  } catch (error) {
    console.error('Brapi integration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assets from Brapi',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}