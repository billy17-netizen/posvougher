import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;
    const { status, storeId } = await request.json();

    // Validate status value
    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Validate storeId
    if (!storeId) {
      // Try to get storeId from query or cookies
      const url = new URL(request.url);
      let urlStoreId = url.searchParams.get('storeId');
      
      if (!urlStoreId) {
        const cookies = request.headers.get('cookie');
        if (cookies) {
          const storeIdMatch = cookies.match(/currentStoreId=([^;]+)/);
          if (storeIdMatch) {
            urlStoreId = storeIdMatch[1];
          }
        }
      }
      
      if (!urlStoreId) {
        return NextResponse.json(
          { error: "Store ID is required" },
          { status: 400 }
        );
      }
      
      // Use the extracted storeId
      const storeIdToUse = urlStoreId;
      
      // Verify transaction belongs to the specified store
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      
      if (!transaction || transaction.storeId !== storeIdToUse) {
        return NextResponse.json(
          { error: "Transaction not found in this store" },
          { status: 404 }
        );
      }
      
      // Update transaction status
      const updatedTransaction = await prisma.transaction.update({
        where: { 
          id: transactionId,
          storeId: storeIdToUse
        },
        data: { status },
      });
      
      return NextResponse.json({ transaction: updatedTransaction });
    }
    
    // When storeId is provided in the request body
    // Verify transaction belongs to the specified store
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    
    if (!transaction || transaction.storeId !== storeId) {
      return NextResponse.json(
        { error: "Transaction not found in this store" },
        { status: 404 }
      );
    }

    // Update transaction status with store verification
    const updatedTransaction = await prisma.transaction.update({
      where: { 
        id: transactionId,
        storeId: storeId
      },
      data: { status },
    });

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Failed to update transaction status" },
      { status: 500 }
    );
  }
} 