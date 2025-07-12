# Direct Upload System Documentation

## Overview

This system implements direct client-side upload to Google Drive, completely bypassing Vercel's serverless function limits. This solves the 413 "FUNCTION_PAYLOAD_TOO_LARGE" error for files over 4.5MB.

## How It Works

### Architecture

1. **Authorization Route** (`/api/upload-auth`) - Edge Runtime
   - Generates Google Drive access tokens using JWT
   - Creates resumable upload sessions
   - Returns upload URLs to client
   - **No file data passes through this route**

2. **Client-Side Upload** (`/lib/directUpload.ts`)
   - Handles actual file uploads directly to Google Drive
   - Supports progress tracking and resumable uploads
   - Automatically chooses best upload strategy based on file size

3. **Smart File Routing**
   - Files ≤ 4MB: Use existing Vercel routes (faster for small files)
   - Files > 4MB: Use direct upload (bypasses Vercel limits)
   - Files > 100MB: Rejected with helpful error message

## File Size Limits

| File Size | Upload Method | Max Size | Notes |
|-----------|---------------|----------|-------|
| ≤ 4MB | Vercel Route | 4MB | Fastest for small files |
| 4MB - 100MB | Direct Upload | 100MB | Bypasses Vercel limits |
| > 100MB | Blocked | - | Show error message |

## Implementation Details

### API Routes

#### `/api/upload-auth` (Edge Runtime)
- **Purpose**: Provides authorization for direct uploads
- **Runtime**: Edge (smaller bundle, faster)
- **Input**: File metadata (name, size, type)
- **Output**: Upload URL and access token
- **Bundle Size**: ~50KB (vs 4.5MB+ with googleapis)

#### Existing Routes (Still Used)
- `/api/upload-drive` - For small files ≤ 4MB
- Other upload routes - Kept for backward compatibility

### Client Library

#### `/lib/directUpload.ts`
```typescript
// Simple usage
import { uploadFile } from '@/lib/directUpload'

const result = await uploadFile({
  file: myFile,
  onProgress: (progress) => console.log(`${progress}% complete`),
  onComplete: (result) => console.log('Upload complete:', result.fileUrl),
  onError: (error) => console.error('Upload failed:', error)
})
```

#### Classes and Functions
- `DirectUploader` - Main upload class with full control
- `uploadFile()` - Convenience function for simple uploads
- `shouldUseDirectUpload()` - Checks if file should use direct upload
- `getUploadStrategy()` - Returns recommended upload strategy

## Frontend Integration

### Submit Page (`/src/app/submit/page.tsx`)
- **Manuscript uploads**: Up to 100MB
- **Cover images**: Up to 10MB
- **Automatic strategy selection**: Based on file size
- **Visual indicators**: Shows upload method to user
- **Progress tracking**: Real-time upload progress

### Admin Page (`/src/app/admin/page.tsx`)
- **Event images**: Up to 50MB
- **Removed image compression**: No longer needed
- **Simplified upload flow**: Uses direct upload utility

## Benefits

### Solved Problems
- ✅ **413 Errors**: No more "FUNCTION_PAYLOAD_TOO_LARGE"
- ✅ **Large Files**: Support for files up to 100MB
- ✅ **Performance**: Faster uploads for large files
- ✅ **Reliability**: Resumable uploads with progress tracking

### Performance Improvements
- **Bundle Size**: Reduced from 4.5MB+ to ~50KB for auth route
- **Upload Speed**: Direct uploads are faster than proxy uploads
- **Cold Start**: Edge runtime has faster cold starts
- **Cost**: Reduced Vercel bandwidth usage

## Configuration

### Environment Variables (Required)
```bash
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

### Security Features
- **JWT Authentication**: Secure token generation
- **Time-limited**: Access tokens expire in 1 hour
- **Scope-limited**: Only allows file creation in specified folder
- **CORS Handling**: Proper CORS headers for client uploads

## Monitoring and Debugging

### Client-Side Logs
```javascript
// Enable detailed logging
const uploader = new DirectUploader({
  file: myFile,
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
  onError: (error) => console.error('Upload error:', error)
})
```

### Server-Side Monitoring
- Check `/api/upload-auth` for authorization issues
- Monitor Google Drive API quotas
- Track upload success rates

## Migration Notes

### From Old System
1. **Existing routes still work** - No breaking changes
2. **Automatic detection** - System chooses best upload method
3. **Backward compatibility** - Old uploads continue to work

### Dependencies Removed
- Image compression logic (no longer needed)
- Complex chunked upload system
- Heavy googleapis imports in upload routes

## Troubleshooting

### Common Issues

#### 1. "Failed to generate access token"
- Check `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`
- Verify private key format (includes line breaks)
- Ensure service account has Drive API access

#### 2. "Upload session creation failed"
- Check Google Drive API quotas
- Verify folder permissions
- Ensure `GOOGLE_DRIVE_FOLDER_ID` is correct

#### 3. "Upload failed at X%"
- Network interruption (uploads are resumable)
- File size exceeds Google Drive limits
- Invalid file type for Google Drive

### Debug Commands
```bash
# Test authorization endpoint
curl -X POST http://localhost:3000/api/upload-auth \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","fileSize":1000000,"fileType":"application/pdf"}'

# Check Google Drive folder
# Visit: https://drive.google.com/drive/folders/YOUR_FOLDER_ID
```

## Future Enhancements

### Planned Features
- [ ] Upload queue for multiple files
- [ ] Automatic file type validation
- [ ] Upload history and retry mechanism
- [ ] Integration with other cloud providers

### Performance Optimizations
- [ ] Parallel chunk uploads
- [ ] Adaptive chunk sizing based on connection speed
- [ ] Background upload with service workers

## Security Considerations

### Current Security Measures
- Service account with minimal permissions
- Time-limited access tokens
- Folder-scoped uploads only
- No permanent credentials in client

### Best Practices
- Regularly rotate service account keys
- Monitor Google Drive API usage
- Implement upload rate limiting if needed
- Validate file types and sizes on both client and server

---

## Quick Start

1. **Set environment variables** in `.env.local`
2. **Import the utility**: `import { uploadFile } from '@/lib/directUpload'`
3. **Use in your component**: Call `uploadFile()` with your file and callbacks
4. **Handle results**: Process success/error responses appropriately

The system automatically handles small vs large files, so you can use it everywhere without worrying about the implementation details. 