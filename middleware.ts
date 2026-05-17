import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow cron routes through without any auth check
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/cron/:path*'],
};
