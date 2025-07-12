import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function PUT(req: NextRequest) {
  try {
    const uploadUrl = req.nextUrl.searchParams.get('uploadUrl')
    const contentRange = req.headers.get('content-range')
    const contentLength = req.headers.get('content-length')

    if (!uploadUrl) {
      return NextResponse.json({ error: 'Upload URL is required' }, { status: 400 })
    }

    if (!contentRange) {
      return NextResponse.json({ error: 'Content-Range header is required' }, { status: 400 })
    }

    // Get the request body
    const body = await req.arrayBuffer()

    // Proxy the request to Google Drive API
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
        'Content-Length': contentLength || body.byteLength.toString(),
      },
      body: body,
    })

    // Handle different response statuses
    if (response.status === 308) {
      // Continue uploading - return the Range header
      const rangeHeader = response.headers.get('Range')
      return new Response(null, {
        status: 308,
        headers: {
          'Range': rangeHeader || '',
        },
      })
    } else if (response.ok) {
      // Upload complete
      const result = await response.json()
      return NextResponse.json(result)
    } else {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Upload failed: ${errorText}` },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Upload chunk error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 