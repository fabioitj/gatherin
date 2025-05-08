import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

// Get user alerts
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
    
    const alerts = await prisma.alert.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { message: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// Create alert
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token || !token.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { keyword, category, country, sector } = await request.json();
    const userId = parseInt(token.id as string);
    
    if (!keyword || keyword.trim() === "") {
      return NextResponse.json(
        { message: "Keyword is required" },
        { status: 400 }
      );
    }
    
    const alert = await prisma.alert.create({
      data: {
        userId,
        keyword,
        category,
        country,
        sector,
      },
    });
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json(
      { message: "Failed to create alert" },
      { status: 500 }
    );
  }
}