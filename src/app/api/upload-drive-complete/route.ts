import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import stream from 'stream';
import uploadSessions from '@/lib/uploadSessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID' },
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
    
    // Ensure all chunks are present
    if (!session.totalChunks) {
      return NextResponse.json(
        { success: false, error: 'Missing total chunks information' },
        { status: 400 }
      );
    }
    
    if (session.chunks.size !== session.totalChunks) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Not all chunks received. Got ${session.chunks.size} of ${session.totalChunks} chunks` 
        },
        { status: 400 }
      );
    }
    
    // Combine all chunks into a single buffer
    const totalSize = Array.from(session.chunks.values()).reduce(
      (total, chunk) => total + chunk.length, 0
    );
    const combinedBuffer = Buffer.alloc(totalSize);
    
    let offset = 0;
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.chunks.get(i);
      if (!chunk) {
        return NextResponse.json(
          { success: false, error: `Missing chunk at index ${i}` },
          { status: 400 }
        );
      }
      chunk.copy(combinedBuffer, offset);
      offset += chunk.length;
    }
    
    console.log(`Combined all ${session.totalChunks} chunks for file ${session.fileName}, total size: ${totalSize} bytes`);
    
    // Upload to Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(combinedBuffer);
    
    const fileMetadata = {
      name: session.fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };
    
    const media = {
      mimeType: session.fileType,
      body: bufferStream,
    };
    
    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    });
    
    const fileId = driveResponse.data.id;
    
    // Update file permissions to make it accessible
    await drive.permissions.create({
      fileId: fileId as string,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    
    // Clean up the session
    uploadSessions.delete(sessionId);
    
    console.log(`File uploaded to Google Drive successfully, ID: ${fileId}`);
    
    return NextResponse.json({
      success: true,
      fileId,
      fileUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload completion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete upload' },
      { status: 500 }
    );
  }
} 