export function getGoogleDriveImageUrl(url: string): string {
  try {
    if (!url) return '/placeholder-cover.jpg'

    // Extract file ID from Google Drive URL
    const fileIdMatch = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/)
    const fileId = fileIdMatch ? fileIdMatch[0] : null

    if (!fileId) return '/placeholder-cover.jpg'

    // Return thumbnail URL
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  } catch (error) {
    console.error('Error processing Google Drive URL:', error)
    return '/placeholder-cover.jpg'
  }
}