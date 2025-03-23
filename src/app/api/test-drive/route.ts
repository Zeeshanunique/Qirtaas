import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Log environment variables availability (without exposing the actual values)
    console.log("Testing Google Drive API credentials...");
    
    const envVariables = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      
      // Check for alternate variable names that might be used
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    };
    
    console.log("Environment variables available:", envVariables);
    
    // Determine which email and key to use
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Verify credentials are available
    if (!clientEmail || !privateKey) {
      return NextResponse.json({
        success: false,
        message: "Google Drive API credentials are missing",
        details: {
          envVariables,
          emailFound: !!clientEmail,
          keyFound: !!privateKey,
          folderIdFound: !!folderId,
          suggestion: "Please check your .env.local file and ensure the correct environment variables are set."
        }
      }, { status: 500 });
    }
    
    // Check if private key is in the correct format
    const privateKeyFormatted = privateKey.replace(/\\n/g, '\n');
    const privateKeyValid = privateKeyFormatted.includes("-----BEGIN PRIVATE KEY-----") && 
                            privateKeyFormatted.includes("-----END PRIVATE KEY-----");
    
    if (!privateKeyValid) {
      return NextResponse.json({
        success: false,
        message: "Google Drive API private key is not in the correct format",
        details: {
          suggestion: "Make sure your private key includes the BEGIN and END markers and all newlines are properly preserved."
        }
      }, { status: 500 });
    }
    
    // Set up Google Drive API client
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKeyFormatted,
      ['https://www.googleapis.com/auth/drive']
    );
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Test API by listing files
    
    // List up to 10 files from the folder
    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      pageSize: 10,
      fields: 'files(id, name, mimeType, webViewLink)',
    });
    
    return NextResponse.json({
      success: true,
      message: "Google Drive API connection successful",
      fileCount: response.data.files?.length || 0,
      // Return limited file data for verification
      files: response.data.files?.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
      })),
    });
  } catch (error: any) {
    console.error('Error testing Google Drive API:', error);
    
    // More detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      errors: error.errors,
    };
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    
    return NextResponse.json({
      success: false,
      message: "Google Drive API connection failed",
      error: error.message,
      details: errorDetails,
    }, { status: 500 });
  }
} 