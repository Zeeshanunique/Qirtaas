import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/api/upload-drive']
};

export function middleware(request: NextRequest) {
  // Bypass the typical body parsing for this route
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-middleware-bypass', '1');
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
} 