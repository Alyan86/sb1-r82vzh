import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password, username, uuid, signInMethod } = await req.json();

  // Validate input
  if (!signInMethod) {
    return NextResponse.json({ error: 'signInMethod is required' }, { status: 400 });
  }

  // Server-side validation
  if (!firstName || firstName.length > 50) {
    return NextResponse.json({ error: 'Invalid first name' }, { status: 400 });
  }
  if (!lastName || lastName.length > 50) {
    return NextResponse.json({ error: 'Invalid last name' }, { status: 400 });
  }
  if (!username || !/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  // Check if username or email already exists
  try {
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUsername) {
      return NextResponse.json({ available: false, message: 'Username already used' }, { status: 409 });
    }

    if (existingEmail) {
      return NextResponse.json({ available: false, message: 'Email already used' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username.toLowerCase(),
        uuid,
        signInMethod // Ensure this field is present in the Prisma schema
      }
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
