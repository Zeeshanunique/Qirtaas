import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

async function bufferToStream(buffer: Buffer) {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    const fileMetadata = {
      name: file.name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    }

    const media = {
      mimeType: file.type,
      body: await bufferToStream(fileBuffer),
    }

    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
    })

    return NextResponse.json({ 
      success: true, 
      fileUrl: driveFile.data.webViewLink,
      fileId: driveFile.data.id
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Upload failed' 
    }, { status: 500 })
  }
}