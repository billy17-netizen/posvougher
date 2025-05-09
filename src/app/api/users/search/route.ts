import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const storeId = searchParams.get('storeId');

    // Basic validation
    if (!storeId) {
      return NextResponse.json(
        { message: 'Store ID is required' },
        { status: 400 }
      );
    }
    
    // Get current user ID from cookies or headers
    let currentUserId = null;
    
    // Try to get user ID from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const userIdCookie = cookieHeader.split(';').find(c => c.trim().startsWith('userId='));
    if (userIdCookie) {
      currentUserId = userIdCookie.split('=')[1];
    }
    
    // If no user ID found, they are not authenticated
    if (!currentUserId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if current user has admin rights in this store
    const currentUserStore = await prisma.userStore.findFirst({
      where: {
        userId: currentUserId,
        storeId,
        role: 'ADMIN'
      }
    });
    
    // Only ADMIN users can search for users to add
    if (!currentUserStore) {
      return NextResponse.json(
        { message: 'Only store admins can search for users to add' },
        { status: 403 }
      );
    }

    // Search for users that match the query
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        stores: {
          where: { storeId },
          select: { id: true }
        }
      },
      take: 10,
    });

    // Transform the data to include hasAccess flag
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      hasAccess: user.stores.length > 0
    }));

    return NextResponse.json({
      users: transformedUsers
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { message: 'An error occurred while searching users' },
      { status: 500 }
    );
  }
} 