// src/app/api/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json();

  // Convert the identifier to lowercase for case-insensitive matching
  const identifierLower = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifierLower }, { username: identifierLower }] },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
}
