import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const getUserPurchases = async (userEmail: string | null): Promise<Set<string>> => {
  if (!userEmail) {
    return new Set()
  }

  try {
    const q = query(
      collection(db, 'purchases'),
      where('purchaserEmail', '==', userEmail.toLowerCase())
    )
    const querySnapshot = await getDocs(q)
    const purchasedSubmissionIds = new Set(
      querySnapshot.docs.map(doc => doc.data().submissionId)
    )
    return purchasedSubmissionIds
  } catch (error) {
    console.error('Error fetching user purchases:', error)
    return new Set()
  }
}

export const hasUserPurchased = (userPurchases: Set<string>, bookId: string): boolean => {
  return userPurchases.has(bookId)
} 