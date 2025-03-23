import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Store upload sessions in memory (in production, use Redis or another persistent store)
interface UploadSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: number;
  chunks: Map<number, Buffer>;
  totalChunks?: number;
}

// In a real app, this should be in a database/Redis
const uploadSessions = new Map<string, UploadSession>();

// Clean up sessions older than 1 hour
function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (now - session.createdAt > 60 * 60 * 1000) { // 1 hour
      uploadSessions.delete(sessionId);
    }
  }
}

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
      createdAt: Date.now(),
      chunks: new Map()
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

// Export the sessions map to be used by other routes
export { uploadSessions }; 