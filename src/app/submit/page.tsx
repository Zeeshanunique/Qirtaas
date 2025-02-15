'use client'

import { useState, useRef, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('loading')
    setErrorMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get('file') as File

      // Validate file
      if (!file) {
        throw new Error('Please select a file to upload')
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit')
      }

      // Check file type
      const allowedTypes = ['.doc', '.docx', '.pdf']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Invalid file type. Please upload a DOC, DOCX, or PDF file')
      }

      // Upload file to Google Drive
      const driveUploadResponse = await axios.post('/api/upload-drive', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })

      if (!driveUploadResponse.data.success) {
        throw new Error('Failed to upload file to Google Drive')
      }

      // Store submission data in Firebase
      const submissionData = {
        name: formData.get('name'),
        email: formData.get('email'),
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        fileUrl: driveUploadResponse.data.fileUrl,
        fileId: driveUploadResponse.data.fileId,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        userId: user?.uid,
        userEmail: user?.email,
      }

      await addDoc(collection(db, 'submissions'), submissionData)
      
      setSubmitStatus('success')
      if (formRef.current) {
        formRef.current.reset()
      }
    } catch (error: any) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting your work')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div>Please sign in to submit your work</div>
  }

  return (
    <div className="min-h-screen bg-beige">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-playfair font-bold text-center mb-8 text-primary">
          Submit Your Work
        </h1>
        
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-secondary">
          <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title of Work</label>
              <input
                type="text"
                id="title"
                name="title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              >
                <option value="">Select a category</option>
                <option value="book">Book</option>
                <option value="story">Short Story</option>
                <option value="poetry">Poetry</option>
                <option value="article">Article</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Brief Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              ></textarea>
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">Upload Manuscript</label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".doc,.docx,.pdf"
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-gray-700"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-lg transition duration-300 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-secondary text-accent hover:bg-sand'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg">
                Your work has been successfully submitted! We will review it and get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                {errorMessage}
              </div>
            )}
          </form>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <h2 className="text-2xl font-playfair font-bold mb-4">Submission Guidelines</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Ensure your manuscript is properly formatted and edited</li>
              <li>Include a detailed synopsis if submitting a book</li>
              <li>Maximum file size: 10MB</li>
              <li>Response time: 4-6 weeks</li>
              <li>Please review our terms and conditions before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}