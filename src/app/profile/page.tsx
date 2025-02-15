'use client'

import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useEffect, useState } from 'react'

interface Submission {
  id: string
  title: string
  category: string
  status: string
  submittedAt: string
  fileUrl: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    if (user) {
      const fetchSubmissions = async () => {
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Submission[]
        setSubmissions(submissionsData)
      }

      fetchSubmissions()
    }
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to view your profile</div>
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-3xl font-playfair font-bold text-primary mb-4">
              Profile
            </h1>
            <div className="mb-4">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="mb-4">
              <strong>Member since:</strong>{' '}
              {new Date(user.metadata.creationTime!).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-playfair font-bold text-primary mb-6">
              Your Submissions
            </h2>
            {submissions.length === 0 ? (
              <p className="text-accent">No submissions yet</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-secondary rounded-lg p-4"
                  >
                    <h3 className="font-bold text-primary mb-2">
                      {submission.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Category:</strong> {submission.category}
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className={`${
                          submission.status === 'pending'
                            ? 'text-yellow-600'
                            : submission.status === 'approved'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <div>
                        <strong>Submitted:</strong>{' '}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-secondary"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}