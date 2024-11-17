import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  // Regular expression to check the basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Regular expression to check for consecutive dots and dots at the start or end of the local part
  const localPartRegex = /^[A-Za-z0-9._%+-]+$/;
  const domainRegex = /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  // Split the email into local and domain parts
  const [localPart, domainPart] = email.split('@');

  if (!emailRegex.test(email) ||
      !localPartRegex.test(localPart) ||
      !domainRegex.test(domainPart) ||
      email.length > 254 ||
      email.includes('..') ||
      localPart.startsWith('.') ||
      localPart.endsWith('.') ||
      !localPart ||
      !domainPart) {
    return NextResponse.json({ available: false, error: 'Invalid email format.' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ available: false });
    } else {
      return NextResponse.json({ available: true });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ available: false, error: 'Internal server error.' }, { status: 500 });
  }
}
