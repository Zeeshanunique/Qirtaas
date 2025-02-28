import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const VIEW_EXPIRY_HOURS = 24

export const incrementBookViews = async (bookId: string, userId?: string | null) => {
  try {
    const viewKey = userId ? `${bookId}_${userId}` : `${bookId}_${generateVisitorId()}`
    const viewRef = doc(db, 'bookViews', viewKey)
    
    // Check if view already exists and is still valid
    const viewDoc = await getDoc(viewRef)
    if (viewDoc.exists()) {
      const lastView = viewDoc.data().timestamp
      const hoursElapsed = (Date.now() - lastView) / (1000 * 60 * 60)
      
      if (hoursElapsed < VIEW_EXPIRY_HOURS) {
        return // Don't increment if view is still valid
      }
    }

    // Update view timestamp
    await setDoc(viewRef, {
      bookId,
      userId: userId || null,
      timestamp: Date.now()
    })

    // Increment book views
    const bookRef = doc(db, 'submissions', bookId)
    await updateDoc(bookRef, {
      views: increment(1)
    })
  } catch (error) {
    console.error('Error incrementing views:', error)
  }
}

// Generate a persistent visitor ID for non-logged-in users
const generateVisitorId = () => {
  let visitorId = localStorage.getItem('visitorId')
  if (!visitorId) {
    visitorId = Math.random().toString(36).substring(2)
    localStorage.setItem('visitorId', visitorId)
  }
  return visitorId
}