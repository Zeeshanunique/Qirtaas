import { NextResponse } from 'next/server';
import uploadSessions from '@/lib/uploadSessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const chunk = formData.get('chunk') as File;
    
    if (!sessionId || isNaN(chunkIndex) || !chunk) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the upload session
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Upload session not found or expired' },
        { status: 404 }
      );
    }
    
    // Update total chunks if not set
    if (!session.totalChunks && totalChunks > 0) {
      session.totalChunks = totalChunks;
    }
    
    // Convert chunk to buffer and store
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    session.chunks.set(chunkIndex, buffer);
    
    console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for session ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`
    });
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process chunk' },
      { status: 500 }
    );
  }
} 