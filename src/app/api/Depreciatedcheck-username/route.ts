import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ available: false });
    } else {
      return NextResponse.json({ available: true });
    }
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ available: false, error: 'Internal server error.' }, { status: 500 });
  }
}
