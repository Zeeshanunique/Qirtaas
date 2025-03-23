// Store upload sessions in memory (in production, use Redis or another persistent store)
interface UploadSession {
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

// Clean up sessions older than 1 hour
export function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (now - session.createdAt > 60 * 60 * 1000) { // 1 hour
      uploadSessions.delete(sessionId);
    }
  }
}

export default uploadSessions; 