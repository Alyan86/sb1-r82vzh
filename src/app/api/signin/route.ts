import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { generateUUID } from '../../utils/uuidGenerator';
import { getClientIp } from '../../utils/ipUtils';
import cookie from 'cookie';

export async function POST(req: NextRequest) {
  const { identifier, password, rememberMe } = await req.json();
  const clientIp = getClientIp(req);

  console.log('Client IP:', clientIp);

  if (!clientIp) {
    return NextResponse.json({ error: 'Could not determine IP address' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const sessionKey = generateUUID();

    // Save the session key and IP address to the user
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionKey, ipAddress: clientIp },
    });

    const response = NextResponse.json({ message: 'Signin successful' }, { status: 200 });
    response.headers.set('Set-Cookie', cookie.serialize('sessionKey', sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: rememberMe ? 3600 * 24 * 7 : 0, // 1 week if "Remember me" is checked, otherwise session cookie
      path: '/'
    }));

    return response;
  } catch (error) {
    console.error('Error signing in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
