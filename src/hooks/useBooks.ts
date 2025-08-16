'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Book {
  id: string
  title: string
  description: string
  category: string
  fileUrl: string
  userEmail: string
  likes: string[]
  comments: {
    id: string
    userId: string
    userName: string
    text: string
    createdAt: string
  }[]
  views: number
  name: string
  author: string
  cover: string
  price: string | number
  isPaid: boolean
  paymentStatus: 'pending' | 'verified' | 'none'
  createdAt?: any
}

export const useBooks = (limitCount?: number) => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let q = query(
          collection(db, 'submissions'),
          where('status', '==', 'approved')
        )

        // Add limit if specified
        if (limitCount) {
          q = query(q, limit(limitCount))
        }

        const querySnapshot = await getDocs(q)
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || [],
          comments: doc.data().comments || [],
          views: doc.data().views || 0,
          isPaid: doc.data().isPaid || false,
          paymentStatus: doc.data().paymentStatus || 'none',
          author: doc.data().name || doc.data().author || 'Unknown Author',
          cover: doc.data().cover || '',
          price: doc.data().price || 0
        })) as Book[]
        
        setBooks(booksData)
      } catch (err) {
        console.error('Error fetching books:', err)
        setError('Failed to fetch books')
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [limitCount])

  return { books, loading, error }
}