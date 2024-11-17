// src/app/api/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set('sessionKey', '', {
    maxAge: -1,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure flag in production
    sameSite: 'lax', // Set sameSite attribute if necessary
  });
  res.headers.set('Cache-Control', 'no-store'); // Prevent caching
  return res;
}
