import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { uploadSessions } from '../upload-drive-init/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, fileName, fileType, totalChunks } = body;
    
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
    
    // Verify we have all chunks
    if (session.chunks.size !== totalChunks) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing chunks. Received ${session.chunks.size} of ${totalChunks}` 
        },
        { status: 400 }
      );
    }
    
    // Combine chunks in order
    console.log(`Combining ${session.chunks.size} chunks for file ${session.fileName}`);
    const sortedChunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkBuffer = session.chunks.get(i);
      if (!chunkBuffer) {
        return NextResponse.json(
          { success: false, error: `Missing chunk at index ${i}` },
          { status: 400 }
        );
      }
      sortedChunks.push(chunkBuffer);
    }
    
    const fileBuffer = Buffer.concat(sortedChunks);
    console.log(`Combined file size: ${Math.round(fileBuffer.length / 1024)} KB`);
    
    // Verify Google Drive credentials are available
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing Google Drive credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error - missing credentials' },
        { status: 500 }
      );
    }

    console.log('Initializing Google Drive client...');
    // Initialize Google Drive client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Optionally use folder ID if available
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let requestBody: any = {
      name: session.fileName,
      mimeType: session.fileType,
    };
    
    if (folderId) {
      console.log(`Using folder ID: ${folderId}`);
      requestBody.parents = [folderId];
    }

    // Create readable stream from buffer
    console.log('Creating readable stream...');
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    // Upload file to Google Drive
    console.log('Starting Drive upload...');
    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: session.fileType,
        body: stream,
      },
      fields: 'id,name,webViewLink,webContentLink',
    });

    console.log('Upload completed, response:', JSON.stringify(response.data));
    
    if (!response.data.id) {
      console.error('Upload succeeded but missing file ID');
      return NextResponse.json(
        { success: false, error: 'Upload response missing data' },
        { status: 500 }
      );
    }

    // Make the file publicly accessible
    console.log(`Setting permissions for file ID: ${response.data.id}`);
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get direct link to the file
    const fileId = response.data.id;
    const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;
    console.log(`File uploaded successfully. Direct link: ${directLink}`);
    
    // Clean up session
    uploadSessions.delete(sessionId);
    
    return NextResponse.json({ 
      success: true, 
      fileId,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directLink
    });
  } catch (error: any) {
    console.error('Upload completion error:', error);
    // Extract detailed error information
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN';
    const errorDetails = error.response?.data?.error || {};
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Upload failed',
        details: {
          message: errorMessage,
          code: errorCode,
          ...errorDetails
        }
      },
      { status: error.code === 'ECONNABORTED' ? 408 : 500 }
    );
  }
} 