import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Invalid news ID" },
      { status: 400 }
    );
  }
  
  try {
    const news = await prisma.news.findUnique({
      where: { id },
    });
    
    if (!news) {
      return NextResponse.json(
        { message: "News not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch news item:", error);
    return NextResponse.json(
      { message: "Failed to fetch news item" },
      { status: 500 }
    );
  }
}