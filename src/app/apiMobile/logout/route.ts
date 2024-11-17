import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get the session key
    const { sessionKey } = await req.json();

    if (!sessionKey) {
      return NextResponse.json({ error: 'Session key is required' }, { status: 400 });
    }

    // Delete the session key from the MobileSession table
    const deletedSession = await prisma.mobileSession.deleteMany({
      where: { sessionKey: sessionKey }
    });

    // Check if the session was deleted
    if (deletedSession.count === 0) {
      return NextResponse.json({ error: 'Session not found or already deleted' }, { status: 404 });
    }

    // Send success response
    return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
