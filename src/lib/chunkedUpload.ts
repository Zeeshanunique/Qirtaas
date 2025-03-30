import axios from 'axios';

export interface ChunkUploadResponse {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Upload a file in chunks to prevent 413 Payload Too Large errors
 * @param file The file to upload
 * @param endpoint The API endpoint to upload to
 * @param chunkSize Size of each chunk in bytes (default: 2MB)
 * @param onProgress Optional callback for progress updates
 * @returns Promise with the upload response
 */
export async function uploadFileInChunks(
  file: File,
  endpoint: string = '/api/upload-drive-chunk',
  chunkSize: number = 2 * 1024 * 1024, // 2MB chunks
  onProgress?: (progress: number) => void
): Promise<ChunkUploadResponse> {
  try {
    // Step 1: Initialize upload session
    const initResponse = await axios.post('/api/upload-drive-init', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (!initResponse.data.success || !initResponse.data.sessionId) {
      throw new Error('Failed to initialize upload session');
    }
    
    const { sessionId } = initResponse.data;
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    // Step 2: Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('chunk', chunk);
      
      await axios.post(endpoint, formData);
      
      if (onProgress) {
        onProgress((chunkIndex + 1) / totalChunks * 100);
      }
    }
    
    // Step 3: Complete upload
    const completeFormData = new FormData();
    completeFormData.append('sessionId', sessionId);
    
    const completeResponse = await axios.post('/api/upload-drive-complete', completeFormData);
    
    return completeResponse.data;
  } catch (error: any) {
    console.error('Chunked upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
      details: error.response?.data?.details || {}
    };
  }
} 