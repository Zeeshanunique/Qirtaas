import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

// Update the config to use the new format
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

// Configure bodyParser
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

async function bufferToStream(buffer: Buffer) {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

export async function POST(req: Request) {
  console.log('Starting file upload process to Google Drive')
  
  try {
    // Verify request is form data
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType)
      return NextResponse.json(
        { success: false, error: 'Request must be multipart/form-data' },
        { status: 400 }
      )
    }
    
    // Log file size limit in headers if present
    const contentLength = req.headers.get('content-length')
    console.log(`Content length: ${contentLength} bytes`)
    
    // Extract form data
    console.log('Extracting form data...')
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('No file in request')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log(`File received: ${file.name}, Size: ${Math.round(file.size / 1024)} KB, Type: ${file.type}`)
    
    // Convert File to Buffer
    console.log('Converting file to buffer...')
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)
    console.log(`Buffer created: ${Math.round(fileBuffer.length / 1024)} KB`)

    // Verify Google Drive credentials are available
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing Google Drive credentials')
      return NextResponse.json(
        { success: false, error: 'Server configuration error - missing credentials' },
        { status: 500 }
      )
    }

    console.log('Initializing Google Drive client...')
    // Initialize Google Drive client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Optionally use folder ID if available
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    let requestBody: any = {
      name: file.name,
      mimeType: file.type,
    }
    
    if (folderId) {
      console.log(`Using folder ID: ${folderId}`)
      requestBody.parents = [folderId]
    }

    // Create readable stream from buffer
    console.log('Creating readable stream...')
    const stream = new Readable()
    stream.push(fileBuffer)
    stream.push(null)

    // Upload file to Google Drive with chunked upload
    console.log('Starting Drive upload...')
    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id,name,webViewLink,webContentLink',
    })

    console.log('Upload completed, response:', JSON.stringify(response.data))
    
    if (!response.data.id) {
      console.error('Upload succeeded but missing file ID')
      return NextResponse.json(
        { success: false, error: 'Upload response missing data' },
        { status: 500 }
      )
    }

    // Make the file publicly accessible
    console.log(`Setting permissions for file ID: ${response.data.id}`)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get direct link to the file
    const fileId = response.data.id
    const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`
    console.log(`File uploaded successfully. Direct link: ${directLink}`)

    return NextResponse.json({ 
      success: true, 
      fileId,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      directLink
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    // Extract detailed error information
    const errorMessage = error.message || 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    const errorDetails = error.response?.data?.error || {}
    
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
    )
  }
}