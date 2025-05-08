import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

// Delete an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request });
  
  if (!token || !token.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  
  const alertId = parseInt(params.id);
  const userId = parseInt(token.id as string);
  
  if (isNaN(alertId)) {
    return NextResponse.json(
      { message: "Invalid alert ID" },
      { status: 400 }
    );
  }
  
  try {
    // Check if the alert belongs to the user
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });
    
    if (!alert) {
      return NextResponse.json(
        { message: "Alert not found" },
        { status: 404 }
      );
    }
    
    if (alert.userId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Delete the alert
    await prisma.alert.delete({
      where: { id: alertId },
    });
    
    return NextResponse.json({ message: "Alert deleted successfully" });
  } catch (error) {
    console.error("Failed to delete alert:", error);
    return NextResponse.json(
      { message: "Failed to delete alert" },
      { status: 500 }
    );
  }
}