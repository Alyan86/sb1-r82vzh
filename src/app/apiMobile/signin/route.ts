import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { generateUUID } from '../../utils/uuidGenerator';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    // Find the user by email or username
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

    // Check if the password matches
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Generate a session key for mobile
    const sessionKey = generateUUID();

    // Save the session key in the MobileSession table for the user
    await prisma.mobileSession.create({
      data: {
        userId: user.id,
        sessionKey: sessionKey,
      }
    });

    // Return the user data along with the session key and email
    return NextResponse.json({
      message: 'Signin successful',
      sessionKey: sessionKey,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email, // Added email to the response
    }, { status: 200 });

  } catch (error) {
    console.error('Error signing in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
