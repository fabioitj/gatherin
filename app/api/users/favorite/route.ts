import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token || !token.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { newsId } = await request.json();
    const userId = parseInt(token.id as string);
    
    if (!newsId) {
      return NextResponse.json(
        { message: "News ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the news exists
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });
    
    if (!news) {
      return NextResponse.json(
        { message: "News not found" },
        { status: 404 }
      );
    }
    
    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        newsId,
      },
    });
    
    if (existingFavorite) {
      // If already favorited, remove it
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      
      return NextResponse.json({ favorited: false });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId,
          newsId,
        },
      });
      
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json(
      { message: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}