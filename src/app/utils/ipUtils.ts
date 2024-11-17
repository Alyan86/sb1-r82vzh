// src/app/utils/ipUtils.ts
import { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string | null {
  // Retrieve the client IP address from the request headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0];
  }
  return null;
}
