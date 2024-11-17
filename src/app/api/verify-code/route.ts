// src/app/api/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { identifier, code } = await req.json();

  // Convert identifier to lowercase for consistency
  const identifierLower = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifierLower }, { username: identifierLower }] },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const verification = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verification) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  // Compare the hashed code with the input code
  const isCodeValid = await bcrypt.compare(code, verification.code);

  if (!isCodeValid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  // Delete the code after successful verification
  await prisma.verificationCode.delete({
    where: { id: verification.id },
  });

  return NextResponse.json({ message: 'Code verified' }, { status: 200 });
}
