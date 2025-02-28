'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore'

interface Comment {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

interface BookSocialProps {
  bookId: string
  likes: string[]
  comments: Comment[]
  views: number
}

export default function BookSocial({ bookId, likes, comments, views }: BookSocialProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLiked = user ? likes.includes(user.uid) : false

  const handleLike = async () => {
    if (!user) return
    
    const bookRef = doc(db, 'submissions', bookId)
    await updateDoc(bookRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    })
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const bookRef = doc(db, 'submissions', bookId)
      const comment = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        text: newComment.trim(),
        createdAt: new Date().toISOString()
      }

      await updateDoc(bookRef, {
        comments: arrayUnion(comment)
      })

      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likes.length}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{comments.length}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{views}</span>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-4">
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{comment.userName}</p>
                    <p className="text-gray-600">{comment.text}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">Please sign in to comment</p>
          )}
        </div>
      )}
    </div>
  )
}