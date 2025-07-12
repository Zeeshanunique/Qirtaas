import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Helper function to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// Helper function to convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Helper function to base64url encode
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Generate access token for Google Drive API
async function generateAccessToken(): Promise<string> {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!clientEmail || !privateKey) {
      throw new Error('Missing Google Drive credentials')
    }

    // Create JWT header and payload
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now
    }

    // Encode header and payload
    const encodedHeader = base64urlEncode(JSON.stringify(header))
    const encodedPayload = base64urlEncode(JSON.stringify(payload))

    // Prepare the private key for import
    const pemHeader = '-----BEGIN PRIVATE KEY-----'
    const pemFooter = '-----END PRIVATE KEY-----'
    const pemKey = privateKey.replace(/\\n/g, '\n')
    const pemContents = pemKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')
    
    // Convert base64 to ArrayBuffer
    const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    // Import private key
    const importedKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )

    // Sign the JWT
    const dataToSign = stringToUint8Array(`${encodedHeader}.${encodedPayload}`)
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      importedKey,
      dataToSign
    )

    // Create JWT
    const encodedSignature = arrayBufferToBase64Url(signature)
    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${errorData}`)
    }

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error: any) {
    console.error('Error generating access token:', error)
    throw new Error(`Failed to generate access token: ${error.message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fileName, fileSize, fileType } = body

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing file information' },
        { status: 400 }
      )
    }

    // Generate access token
    const accessToken = await generateAccessToken()

    // Create upload session with Google Drive
    const sessionResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${Date.now()}-${fileName}`,
          parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
        }),
      }
    )

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.text()
      throw new Error(`Failed to create upload session: ${errorData}`)
    }

    const uploadUrl = sessionResponse.headers.get('Location')
    
    if (!uploadUrl) {
      throw new Error('No upload URL received from Google Drive')
    }

    return NextResponse.json({
      success: true,
      uploadUrl,
      accessToken,
      expiresIn: 3600, // 1 hour
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
    })
  } catch (error: any) {
    console.error('Error creating upload authorization:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 