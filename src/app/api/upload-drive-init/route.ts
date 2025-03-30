import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import uploadSessions, { cleanupSessions } from '@/lib/uploadSessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    cleanupSessions();
    
    const body = await req.json();
    const { fileName, fileSize, fileType } = body;
    
    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing file information' },
        { status: 400 }
      );
    }
    
    const sessionId = uuidv4();
    uploadSessions.set(sessionId, {
      sessionId,
      fileName,
      fileSize,
      fileType,
      chunks: new Map(),
      createdAt: Date.now()
    });
    
    console.log(`Upload session ${sessionId} created for ${fileName} (${fileSize} bytes)`);
    
    return NextResponse.json({
      success: true,
      sessionId,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error: any) {
    console.error('Upload session initialization error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize upload' },
      { status: 500 }
    );
  }
} 