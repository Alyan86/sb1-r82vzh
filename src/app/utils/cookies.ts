import { NextRequest } from 'next/server';
import cookie from 'cookie';

export function parseCookies(req: NextRequest) {
  return cookie.parse(req.headers.get('cookie') || '');
}
