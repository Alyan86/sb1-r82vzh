import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get the session key from the request headers or query params (since mobile apps may store it locally)
    const sessionKey = req.headers.get('x-session-key') || req.nextUrl.searchParams.get('sessionKey');

    if (!sessionKey) {
      return NextResponse.json({ isAuthenticated: false, error: 'No session key provided' });
    }

    // Check if the session key exists in the MobileSession table
    const session = await prisma.mobileSession.findFirst({
      where: { sessionKey },
    });

    if (session) {
      // Session key found, return authenticated
      return NextResponse.json({ isAuthenticated: true, userId: session.userId });
    } else {
      // Session key not found, return unauthenticated
      return NextResponse.json({ isAuthenticated: false, error: 'Session key not found' });
    }
  } catch (error: any) {
    console.error('Error checking mobile auth:', error);
    return NextResponse.json({ isAuthenticated: false, error: 'Internal server error' });
  }
}
