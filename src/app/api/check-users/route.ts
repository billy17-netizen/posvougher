import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const storeId = url.searchParams.get('storeId');
    
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    // Get user with their store relationships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // If storeId provided, check if user has access to this specific store
    let hasStoreAccess = false;
    if (storeId) {
      hasStoreAccess = user.stores.some(store => store.storeId === storeId);
    }
    
    // Return user details with store access information
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        stores: user.stores,
        hasAccessToRequestedStore: hasStoreAccess
      }
    });
    
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { message: 'An error occurred while checking user' },
      { status: 500 }
    );
  }
} 