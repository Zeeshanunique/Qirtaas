import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Upload endpoints are working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
      },
      routes: {
        'upload-drive': '/api/upload-drive',
        'upload-drive-simple': '/api/upload-drive-simple',
        'upload-drive-init': '/api/upload-drive-init',
        'upload-drive-chunk': '/api/upload-drive-chunk',
        'upload-drive-complete': '/api/upload-drive-complete',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST endpoint is working',
    timestamp: new Date().toISOString()
  });
}
