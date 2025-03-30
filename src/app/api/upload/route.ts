import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

// Helper function to get direct image URL from Google Drive
function getFileUrl(fileId: string): string {
  // This format works better with most browsers and avoids CORS issues
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

export async function POST(request: NextRequest) {
  try {
    // Log environment variables availability (without exposing the actual values)
    console.log("Checking Google Drive API credentials...")
    
    const envVariables = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      
      // Check for alternate variable names that might be used
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    }
    
    console.log("Environment variables available:", envVariables)
    
    // Determine which email and key to use
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    
    // Verify if credentials are properly loaded
    if (!clientEmail || !privateKey) {
      console.error("ERROR: Google Drive API credentials are missing. Please check your .env.local file.")
      return NextResponse.json({ 
        error: "Server configuration error: Missing Google Drive API credentials",
        details: {
          envVariables,
          suggestion: "Check your .env.local file and ensure the correct environment variables are set."
        }
      }, { status: 500 })
    }

    // Make sure private key is in the correct format
    const privateKeyFormatted = privateKey.replace(/\\n/g, '\n')
    
    // Set up Google Drive API client
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKeyFormatted,
      ['https://www.googleapis.com/auth/drive']
    )
    const drive = google.drive({ version: 'v3', auth })
    
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      )
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Convert File to buffer
    console.log("Converting file to buffer...")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create a readable stream from the buffer
    console.log("Creating readable stream...")
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null) // Mark the end of the stream

    console.log(`Uploading file: ${file.name}, size: ${Math.round(buffer.length / 1024)}KB, type: ${file.type}`)

    // Create file metadata
    console.log("Using folder ID:", folderId ? "Found" : "Not found")
    const fileMetadata = {
      name: `${Date.now()}-${file.name}`,
      parents: folderId ? [folderId] : undefined,
    }

    // Upload file to Google Drive
    console.log("Starting Drive upload...")
    const media = {
      mimeType: file.type,
      body: readable,
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })
    
    if (!response || !response.data || !response.data.id) {
      console.error("Drive API response missing data:", response)
      return NextResponse.json({ error: "Invalid response from Google Drive API" }, { status: 500 })
    }
    
    console.log("Upload successful, file ID:", response.data.id)

    // Make the file publicly accessible with more explicit permissions
    console.log("Setting file permissions...")
    try {
      await drive.permissions.create({
        fileId: response.data.id as string,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        fields: 'id',
      })
      console.log("Permissions set successfully")
    } catch (permError) {
      console.error("Error setting permissions:", permError)
      // Continue anyway, as the file is uploaded
    }

    const fileUrl = getFileUrl(response.data.id as string)
    console.log("Direct link generated:", fileUrl)

    // Return the file information
    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      fileUrl: fileUrl,
    })
  } catch (error: any) {
    console.error('Error uploading file to Google Drive:', error)
    // Log more details about the error
    if (error.response) {
      console.error('Error response from Google API:', error.response.data)
    }
    return NextResponse.json(
      { error: `Failed to upload: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 