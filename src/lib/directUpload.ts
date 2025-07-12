// Client-side direct upload to Google Drive
// This bypasses Vercel's serverless functions and uploads directly to Google Drive

export interface DirectUploadOptions {
  file: File
  onProgress?: (progress: number) => void
  onComplete?: (result: DirectUploadResult) => void
  onError?: (error: Error) => void
  chunkSize?: number
}

export interface DirectUploadResult {
  success: boolean
  fileId?: string
  fileUrl?: string
  webViewLink?: string
  error?: string
}

export interface UploadAuth {
  uploadUrl: string
  accessToken: string
  expiresIn: number
  maxFileSize: number
}

// Size thresholds
const SMALL_FILE_LIMIT = 4 * 1024 * 1024 // 4MB - use existing Vercel routes
const LARGE_FILE_LIMIT = 100 * 1024 * 1024 // 100MB - use direct upload
const CHUNK_SIZE = 1024 * 1024 // 1MB chunks for resumable upload

export class DirectUploader {
  private file: File
  private uploadUrl: string = ''
  private accessToken: string = ''
  private onProgress?: (progress: number) => void
  private onComplete?: (result: DirectUploadResult) => void
  private onError?: (error: Error) => void
  private chunkSize: number
  private abortController: AbortController

  constructor(options: DirectUploadOptions) {
    this.file = options.file
    this.onProgress = options.onProgress
    this.onComplete = options.onComplete
    this.onError = options.onError
    this.chunkSize = options.chunkSize || CHUNK_SIZE
    this.abortController = new AbortController()
  }

  // Main upload method that chooses the best strategy
  async upload(): Promise<DirectUploadResult> {
    try {
      // For small files, use existing Vercel routes
      if (this.file.size <= SMALL_FILE_LIMIT) {
        return await this.uploadViaVercel()
      }

      // For large files, use direct upload
      return await this.uploadDirectly()
    } catch (error) {
      const errorResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
      
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error('Upload failed'))
      }
      
      return errorResult
    }
  }

  // Upload small files via existing Vercel routes
  private async uploadViaVercel(): Promise<DirectUploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', this.file)

      const response = await fetch('/api/upload-drive', {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (this.onProgress) {
        this.onProgress(100)
      }

      const successResult: DirectUploadResult = {
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        webViewLink: result.webViewLink,
      }

      if (this.onComplete) {
        this.onComplete(successResult)
      }

      return successResult
    } catch (error) {
      throw new Error(`Vercel upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Upload large files directly to Google Drive
  private async uploadDirectly(): Promise<DirectUploadResult> {
    try {
      // Step 1: Get upload authorization
      const auth = await this.getUploadAuth()
      this.uploadUrl = auth.uploadUrl
      this.accessToken = auth.accessToken

      // Step 2: Upload the file
      const fileId = await this.performResumableUpload()

      // Step 3: Make file publicly accessible
      await this.setFilePermissions(fileId)

      const successResult: DirectUploadResult = {
        success: true,
        fileId,
        fileUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
        webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      }

      if (this.onComplete) {
        this.onComplete(successResult)
      }

      return successResult
    } catch (error) {
      throw new Error(`Direct upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get upload authorization from our API
  private async getUploadAuth(): Promise<UploadAuth> {
    const response = await fetch('/api/upload-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: this.file.name,
        fileSize: this.file.size,
        fileType: this.file.type,
      }),
      signal: this.abortController.signal,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get upload authorization')
    }

    return await response.json()
  }

  // Perform resumable upload to Google Drive via proxy
  private async performResumableUpload(): Promise<string> {
    const totalSize = this.file.size
    let uploadedBytes = 0

    // Upload in chunks for progress tracking
    while (uploadedBytes < totalSize) {
      const chunk = this.file.slice(uploadedBytes, uploadedBytes + this.chunkSize)
      const chunkSize = chunk.size
      
      // Use our proxy route to avoid CORS issues
      const response = await fetch(`/api/upload-chunk?uploadUrl=${encodeURIComponent(this.uploadUrl)}`, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunkSize - 1}/${totalSize}`,
          'Content-Length': chunkSize.toString(),
        },
        body: chunk,
        signal: this.abortController.signal,
      })

      if (response.status === 308) {
        // Continue uploading
        const rangeHeader = response.headers.get('Range')
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=0-(\d+)/)
          if (match) {
            uploadedBytes = parseInt(match[1]) + 1
          }
        } else {
          uploadedBytes += chunkSize
        }
      } else if (response.ok) {
        // Upload complete
        const result = await response.json()
        return result.id
      } else {
        const errorData = await response.json()
        throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`)
      }

      // Update progress
      if (this.onProgress) {
        this.onProgress(Math.round((uploadedBytes / totalSize) * 100))
      }
    }

    throw new Error('Upload completed but no file ID received')
  }

  // Set file permissions to make it publicly accessible via proxy
  private async setFilePermissions(fileId: string): Promise<void> {
    try {
      const response = await fetch('/api/upload-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          accessToken: this.accessToken,
        }),
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        console.warn('Failed to set file permissions, but upload succeeded')
      }
    } catch (error) {
      console.warn('Failed to set file permissions:', error)
      // Don't throw error as the upload itself succeeded
    }
  }

  // Abort upload
  abort(): void {
    this.abortController.abort()
  }
}

// Convenience function for simple uploads
export async function uploadFile(options: DirectUploadOptions): Promise<DirectUploadResult> {
  const uploader = new DirectUploader(options)
  return await uploader.upload()
}

// Check if file should use direct upload
export function shouldUseDirectUpload(file: File): boolean {
  return file.size > SMALL_FILE_LIMIT
}

// Get upload strategy recommendation
export function getUploadStrategy(file: File): 'vercel' | 'direct' | 'too-large' {
  if (file.size <= SMALL_FILE_LIMIT) {
    return 'vercel'
  } else if (file.size <= LARGE_FILE_LIMIT) {
    return 'direct'
  } else {
    return 'too-large'
  }
} 