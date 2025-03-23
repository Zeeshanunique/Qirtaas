import { google } from 'googleapis'
import fs from 'fs'
import { Readable } from 'stream'

// Initialize Google Drive API client using environment variables
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
  key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({ version: 'v3', auth })

// Upload a file to Google Drive directly from the client
export async function uploadToDrive(file: File): Promise<string> {
  try {
    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create a readable stream from the buffer
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    // Specify the folder ID where files should be uploaded
    // This should be set in your .env.local file
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
        mimeType: file.type,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id,webViewLink',
    })

    // Update file permissions to make it accessible by anyone with the link
    await drive.permissions.create({
      fileId: response.data.id as string,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get direct link for image display
    const fileId = response.data.id
    const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    
    return fileUrl
  } catch (error) {
    console.error('Error uploading to Google Drive:', error)
    throw new Error('Failed to upload to Google Drive. Check server logs for details.')
  }
}

// Get file information from Google Drive
export async function getFileInfo(fileId: string) {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,webViewLink,thumbnailLink',
    })
    return response.data
  } catch (error) {
    console.error('Error getting file info from Google Drive:', error)
    throw new Error('Failed to get file information from Google Drive')
  }
} 