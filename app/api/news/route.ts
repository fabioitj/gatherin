import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  const sector = searchParams.get("sector");
  
  // Create filter object
  const filter: any = {};
  
  if (category) {
    filter.category = category;
  }
  
  if (country) {
    filter.country = country;
  }
  
  if (sector) {
    filter.sector = sector;
  }
  
  try {
    const news = await prisma.news.findMany({
      where: filter,
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
    });
    
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { message: "Failed to fetch news" },
      { status: 500 }
    );
  }
}