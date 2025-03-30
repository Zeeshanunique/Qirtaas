// Store upload sessions in memory (in production, use Redis or another persistent store)
export interface UploadSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: number;
  chunks: Map<number, Buffer>;
  totalChunks?: number;
}

// In a real app, this should be in a database/Redis
const uploadSessions = new Map<string, UploadSession>();

// Function to clean up expired sessions (older than 1 hour)
export function cleanupSessions() {
  const now = Date.now();
  
  // Use Array.from to convert map entries to an array first
  Array.from(uploadSessions.keys()).forEach(sessionId => {
    const session = uploadSessions.get(sessionId);
    if (session && now - session.createdAt > 60 * 60 * 1000) { // 1 hour
      uploadSessions.delete(sessionId);
    }
  });
}

export default uploadSessions; 