import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import { getClientIp } from '../../utils/ipUtils';

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    if (!clientIp) {
      return NextResponse.json({ isAuthenticated: false, error: 'Could not determine IP address' });
    }

    const cookies = req.cookies;
    const sessionKey = cookies.get('sessionKey')?.value;

    if (!sessionKey) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const user = await prisma.user.findFirst({
      where: { sessionKey }
    });

    if (user) {
      if (user.ipAddress !== clientIp) {
        await prisma.user.update({
          where: { id: user.id },
          data: { sessionKey: null, ipAddress: null },
        });
        return NextResponse.json({ isAuthenticated: false, error: 'Unauthorized access detected. Please login again.' });
      }

      return NextResponse.json({ isAuthenticated: true, user });
    } else {
      return NextResponse.json({ isAuthenticated: false });
    }
  } catch (error: any) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ isAuthenticated: false, error: 'Internal server error' });
  }
}
