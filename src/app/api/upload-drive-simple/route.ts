import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import stream from 'stream';

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
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB for simple upload)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File too large. Please use chunked upload for files over 10MB.' 
        },
        { status: 413 }
      );
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create buffer stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    
    const fileMetadata = {
      name: file.name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };
    
    const media = {
      mimeType: file.type,
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
    
    console.log(`File uploaded to Google Drive successfully, ID: ${fileId}`);
    
    return NextResponse.json({
      success: true,
      fileId,
      fileUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Simple upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
