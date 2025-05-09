import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, storeId, role = 'KASIR', setAsDefault = false } = await request.json();

    // Basic validation
    if (!userId || !storeId) {
      return NextResponse.json(
        { message: 'User ID and Store ID are required' },
        { status: 400 }
      );
    }

    // Get current user from the request
    let currentUserId = null;
    
    // Try to get user ID from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const userIdCookie = cookieHeader.split(';').find(c => c.trim().startsWith('userId='));
    if (userIdCookie) {
      currentUserId = userIdCookie.split('=')[1];
    }
    
    // Alternatively, get from authorization header
    if (!currentUserId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // This assumes you store the user ID in the token - adjust as needed
        const token = authHeader.slice(7);
        try {
          // Simple token parsing - in a real app, you'd validate the JWT properly
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.userId;
        } catch (e) {
          console.error('Failed to parse auth token:', e);
        }
      }
    }
    
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

    // If not an admin and not adding themselves, deny access
    if (!currentUserStore && currentUserId !== userId) {
      console.log(`Access denied: User ${currentUserId} is not an admin in store ${storeId}`);
      return NextResponse.json(
        { message: 'Only store admins can add users to a store' },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { message: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existingRelation = await prisma.userStore.findFirst({
      where: {
        userId,
        storeId,
      },
    });

    if (existingRelation) {
      // If the role is different, update it
      if (existingRelation.role !== role) {
        await prisma.userStore.update({
          where: {
            id: existingRelation.id
          },
          data: {
            role
          }
        });
        console.log(`Updated role for user ${userId} in store ${storeId} to ${role}`);
      }
      
      // Set as default store if requested
      if (setAsDefault) {
        await prisma.user.update({
          where: { id: userId },
          data: { defaultStoreId: storeId }
        });
        console.log(`Set store ${storeId} as default for user ${userId}`);
      }
      
      return NextResponse.json(
        { message: 'User already has access to this store', success: true },
        { status: 200 }
      );
    }

    // Also update the user's role in the User table if not already set
    if (!user.role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });
      console.log(`Set role for user ${userId} to ${role} in User table`);
    }

    // Add user to store with the specified role
    await prisma.userStore.create({
      data: {
        userId,
        storeId,
        role,
      },
    });
    console.log(`Added user ${userId} to store ${storeId} with role ${role}`);
    
    // Set as default store if requested or if user has no default store
    if (setAsDefault || !user.defaultStoreId) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultStoreId: storeId }
      });
      console.log(`Set store ${storeId} as default for user ${userId}`);
    }

    return NextResponse.json({
      message: 'User added to store successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error adding user to store:', error);
    return NextResponse.json(
      { message: 'An error occurred while adding user to store' },
      { status: 500 }
    );
  }
} 