import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token || !token.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const userId = parseInt(token.id as string);
    
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        news: true,
      },
      orderBy: {
        savedAt: "desc",
      },
    });
    
    // Transform to return news with favorite info
    const favoriteNews = favorites.map((fav) => ({
      ...fav.news,
      savedAt: fav.savedAt,
      favoriteId: fav.id,
    }));
    
    return NextResponse.json(favoriteNews);
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return NextResponse.json(
      { message: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}