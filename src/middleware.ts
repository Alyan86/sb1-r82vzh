import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Using `jose` instead of `jsonwebtoken` for Edge compatibility

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    (req as any).user = payload; // Type assertion to avoid TypeScript error
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid token:', error);
    return NextResponse.next();
  }
}
