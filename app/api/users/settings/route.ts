import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

// Get user settings
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
    
    let settings = await prisma.settings.findUnique({
      where: {
        userId,
      },
    });
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          userId,
          theme: "light",
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update user settings
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token || !token.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { theme } = await request.json();
    const userId = parseInt(token.id as string);
    
    if (!theme || (theme !== "light" && theme !== "dark")) {
      return NextResponse.json(
        { message: "Invalid theme value" },
        { status: 400 }
      );
    }
    
    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: {
        userId,
      },
      update: {
        theme,
      },
      create: {
        userId,
        theme,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 }
    );
  }
}