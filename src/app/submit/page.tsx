'use client'

import { useState, useRef, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { BOOK_CATEGORIES } from '@/constants/categories'
import { uploadFile, getUploadStrategy, DirectUploadResult } from '@/lib/directUpload'

export default function SubmitPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState({
    manuscript: 0,
    cover: 0
  })
  const [uploadStrategy, setUploadStrategy] = useState<{
    manuscript: 'vercel' | 'direct' | 'too-large'
    cover: 'vercel' | 'direct' | 'too-large'
  }>({ manuscript: 'vercel', cover: 'vercel' })

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const resetProgress = () => {
    setUploadProgress({
      manuscript: 0,
      cover: 0
    })
  }

  // Handle file selection to show upload strategy
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'manuscript' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      const strategy = getUploadStrategy(file)
      setUploadStrategy(prev => ({ ...prev, [type]: strategy }))
    }
  }

  // Upload file using the new direct upload system
  const uploadFileOptimized = async (file: File, type: 'manuscript' | 'cover'): Promise<string> => {
    return new Promise((resolve, reject) => {
      uploadFile({
        file,
        onProgress: (progress) => {
          setUploadProgress(prev => ({ ...prev, [type]: progress }))
        },
        onComplete: (result: DirectUploadResult) => {
          if (result.success && result.fileUrl) {
            resolve(result.fileUrl)
          } else {
            reject(new Error(result.error || 'Upload failed'))
          }
        },
        onError: (error) => {
          reject(error)
        }
      })
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('loading')
    setErrorMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      const manuscriptFile = formData.get('file') as File
      const coverFile = formData.get('cover') as File

      // Validate manuscript file
      if (!manuscriptFile) {
        throw new Error('Please select a manuscript file to upload')
      }

      // Validate cover file
      if (!coverFile) {
        throw new Error('Please select a cover image')
      }

      // Check manuscript file size (100MB limit for direct upload)
      if (manuscriptFile.size > 100 * 1024 * 1024) {
        throw new Error('Manuscript file size exceeds 100MB limit. Please compress or split your file.')
      }

      // Check cover file size (10MB limit)
      if (coverFile.size > 10 * 1024 * 1024) {
        throw new Error('Cover image size exceeds 10MB limit')
      }

      // Check manuscript file type
      const allowedManuscriptTypes = ['.doc', '.docx', '.pdf']
      const manuscriptExtension = manuscriptFile.name.substring(manuscriptFile.name.lastIndexOf('.')).toLowerCase()
      if (!allowedManuscriptTypes.includes(manuscriptExtension)) {
        throw new Error('Invalid manuscript file type. Please upload a DOC, DOCX, or PDF file')
      }

      // Check cover file type
      const allowedCoverTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedCoverTypes.includes(coverFile.type)) {
        throw new Error('Invalid cover image type. Please upload a JPG or PNG file')
      }

      // Upload files using the optimized direct upload system
      console.log(`Uploading manuscript (${Math.round(manuscriptFile.size / 1024 / 1024)}MB) using ${getUploadStrategy(manuscriptFile)} strategy`)
      const manuscriptUrl = await uploadFileOptimized(manuscriptFile, 'manuscript')

      console.log(`Uploading cover (${Math.round(coverFile.size / 1024)}KB) using ${getUploadStrategy(coverFile)} strategy`)
      const coverUrl = await uploadFileOptimized(coverFile, 'cover')

      // Store submission data in Firebase
      const submissionData = {
        name: formData.get('name'),
        email: formData.get('email'),
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        fileUrl: manuscriptUrl,
        cover: coverUrl,
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
      resetProgress()
      setUploadStrategy({ manuscript: 'vercel', cover: 'vercel' })
    } catch (error: any) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting your work')
      resetProgress()
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUploadMethodText = (strategy: 'vercel' | 'direct' | 'too-large'): string => {
    switch (strategy) {
      case 'vercel':
        return 'Standard upload'
      case 'direct':
        return 'Direct upload (bypasses server limits)'
      case 'too-large':
        return 'File too large (max 100MB)'
      default:
        return 'Standard upload'
    }
  }

  const getUploadMethodColor = (strategy: 'vercel' | 'direct' | 'too-large'): string => {
    switch (strategy) {
      case 'vercel':
        return 'text-green-600'
      case 'direct':
        return 'text-blue-600'
      case 'too-large':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!user) {
    return <div>Please sign in to submit your work</div>
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8 text-center">
              Submit Your Work
            </h1>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <h3 className="font-bold">Thank you for your submission!</h3>
                <p>We've received your manuscript and will review it shortly. You'll receive an email update once our team has reviewed your work.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="font-bold">Submission Error</h3>
                <p>{errorMessage}</p>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
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
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Work Title</label>
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
                  {BOOK_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
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
                <label htmlFor="cover" className="block text-sm font-medium text-gray-700">Cover Image</label>
                <input
                  type="file"
                  id="cover"
                  name="cover"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => handleFileSelect(e, 'cover')}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-gray-700"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: JPG, PNG. Max size: 10MB
                </p>
                <p className={`mt-1 text-sm ${getUploadMethodColor(uploadStrategy.cover)}`}>
                  Upload method: {getUploadMethodText(uploadStrategy.cover)}
                </p>
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">Upload Manuscript</label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => handleFileSelect(e, 'manuscript')}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-gray-700"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: PDF, DOC, DOCX. Max size: 100MB
                </p>
                <p className={`mt-1 text-sm ${getUploadMethodColor(uploadStrategy.manuscript)}`}>
                  Upload method: {getUploadMethodText(uploadStrategy.manuscript)}
                </p>
              </div>

              {/* Upload Progress */}
              {(uploadProgress.manuscript > 0 || uploadProgress.cover > 0) && (
                <div className="space-y-2">
                  {uploadProgress.manuscript > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Uploading manuscript...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.manuscript}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress.manuscript}% complete
                      </p>
                    </div>
                  )}
                  {uploadProgress.cover > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Uploading cover...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.cover}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress.cover}% complete
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Upload Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Files under 4MB use standard upload through our servers</li>
                  <li>• Files over 4MB use direct upload to bypass server limits</li>
                  <li>• Maximum file size: 100MB</li>
                  <li>• Large files may take several minutes to upload</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || uploadStrategy.manuscript === 'too-large' || uploadStrategy.cover === 'too-large'}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
              >
                {isSubmitting ? 'Uploading...' : 'Submit Work'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}