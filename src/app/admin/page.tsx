'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isAdmin } from '@/utils/adminAuth'

interface Submission {
  id: string
  title: string
  category: string
  description: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  userEmail: string
  reviewNotes?: string
  price: number
  isPaid: boolean
  paymentStatus: 'pending' | 'verified' | 'none'
  paymentVerifiedAt?: string
  paymentVerifiedBy?: string
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [updateLoading, setUpdateLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user.email))) {
      router.push('/')
    }
  }, [user, loading, router])

  // Fetch submissions with ordering
  useEffect(() => {
    const fetchSubmissions = async () => {
      const q = query(
        collection(db, 'submissions'),
        orderBy('submittedAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[]
      setSubmissions(submissionsData)
    }

    if (user && isAdmin(user.email)) {
      fetchSubmissions()
    }
  }, [user])

  // Handle payment verification
  const handleVerifyPayment = async (submissionId: string) => {
    try {
      setUpdateLoading(true)
      const submissionRef = doc(db, 'submissions', submissionId)
      await updateDoc(submissionRef, {
        paymentStatus: 'verified',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user?.email
      })

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, paymentStatus: 'verified' } 
            : sub
        )
      )
    } catch (error) {
      console.error('Error verifying payment:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle submission status update with review notes
  const handleUpdateStatus = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdateLoading(true)
      const submissionRef = doc(db, 'submissions', submissionId)
      await updateDoc(submissionRef, {
        status: newStatus,
        reviewNotes: reviewNotes,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.email,
        isPaid: selectedSubmission?.isPaid || false,
        price: selectedSubmission?.price || 0,
        paymentStatus: selectedSubmission?.isPaid ? 'pending' : 'none'
      })
      
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: newStatus, reviewNotes } 
            : sub
        )
      )
      setSelectedSubmission(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  // Add this after other handler functions
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return
    }

    try {
      setUpdateLoading(true)
      const submissionRef = doc(db, 'submissions', submissionId)
      await deleteDoc(submissionRef)
      
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId))
    } catch (error) {
      console.error('Error deleting submission:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => 
    filter === 'all' ? true : sub.status === filter
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
    return null // This will be handled by the useEffect redirect
  }

  return (
    <div className="min-h-screen bg-beige py-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-playfair font-bold text-primary">
            Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Submissions</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {submission.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {submission.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          submission.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {submission.isPaid ? (
                          <>
                            {submission.price} INR
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${submission.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                                submission.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {submission.paymentStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-green-600">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setReviewNotes(submission.reviewNotes || '')
                          }}
                          className="text-primary hover:text-secondary"
                        >
                          Review
                        </button>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-secondary"
                        >
                          View Document
                        </a>
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={updateLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  Review Submission
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Title</h3>
                    <p className="mt-1">{selectedSubmission.title}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Category</h3>
                    <p className="mt-1">{selectedSubmission.category}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Description</h3>
                  <p className="mt-1 whitespace-pre-wrap">{selectedSubmission.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Submitted By</h3>
                  <p className="mt-1">{selectedSubmission.userEmail}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedSubmission.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Document Preview</h3>
                  <div className="mt-2">
                    <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">Book Access Type</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isPaid"
                          checked={!selectedSubmission.isPaid}
                          onChange={() => setSelectedSubmission(prev => 
                            prev ? { ...prev, isPaid: false, price: 0 } : prev
                          )}
                          className="mr-2"
                        />
                        Free
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isPaid"
                          checked={selectedSubmission.isPaid}
                          onChange={() => setSelectedSubmission(prev => 
                            prev ? { ...prev, isPaid: true } : prev
                          )}
                          className="mr-2"
                        />
                        Paid
                      </label>
                    </div>
                  </div>

                  {selectedSubmission.isPaid && (
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        Price (SAR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedSubmission.price}
                        onChange={(e) => setSelectedSubmission(prev => 
                          prev ? { ...prev, price: parseFloat(e.target.value) } : prev
                        )}
                        className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  )}

                  {selectedSubmission.isPaid && selectedSubmission.paymentStatus === 'pending' && (
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600">Payment Pending Verification</span>
                      <button
                        onClick={async () => {
                          await handleVerifyPayment(selectedSubmission.id)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify Payment
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Review Notes</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full h-32 rounded-lg border-gray-300 focus:border-primary focus:ring-primary resize-none"
                    placeholder="Add your review notes here... These notes will be visible to the submitter."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'approved')}
                  disabled={updateLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {updateLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'rejected')}
                  disabled={updateLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {updateLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}