'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isAdmin } from '@/utils/adminAuth'
import { FaCalendar, FaMapMarkerAlt, FaClock, FaTrash, FaEdit, FaPlus } from 'react-icons/fa'

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

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category?: string
  image?: string
  imageUrl: string
  createdAt: string
  updatedAt?: string
}

interface EventFormData {
  id: string;
  title: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  category: string;
  image: File | null;
  imageUrl: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'submissions' | 'events'>('submissions')
  
  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [updateLoading, setUpdateLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  
  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [eventFormData, setEventFormData] = useState<EventFormData>({
    id: '',
    title: '',
    date: '',
    time: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    category: 'Book Launch',
    image: null,
    imageUrl: ''
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [eventSuccess, setEventSuccess] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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

  // Fetch events
  const fetchEvents = async () => {
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('createdAt', 'desc')
      );
      const eventsSnapshot = await getDocs(q);
      const eventsList = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    }
  };

  useEffect(() => {
    if (user && isAdmin(user.email) && activeTab === 'events') {
      fetchEvents()
    }
  }, [user, activeTab])

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

  // Handle delete submission
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

  // Image compression function
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Target width and height (max dimensions while preserving aspect ratio)
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get reduced file as blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            file.type,
            0.8 // Quality parameter for JPEG (0.8 = 80% quality)
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  // Handle event image upload
  const uploadEventImage = async (file: File): Promise<string> => {
    if (!file) return ''
    
    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      // Compress the image first
      console.log("Compressing image, original size:", Math.round(file.size / 1024), "KB")
      const compressedBlob = await compressImage(file)
      console.log("Compressed size:", Math.round(compressedBlob.size / 1024), "KB")
      
      // Create a new File object from the compressed blob
      const compressedFile = new File([compressedBlob], file.name, { type: file.type })
      
      // Check if file is large (over 2MB) or we're in production (Vercel)
      const isLargeFile = compressedFile.size > 2 * 1024 * 1024;
      const isProduction = window.location.hostname.includes('vercel.app');
      
      let fileId, directLink;
      
      if (isLargeFile || isProduction) {
        // Use chunked upload for large files or in production
        console.log("Using chunked upload for large file or production environment");
        
        // Import the chunked upload utility
        const { uploadFileInChunks } = await import('@/lib/chunkedUpload');
        
        // Set up progress tracking
        const trackProgress = (progress: number) => {
          setUploadProgress(progress);
        };
        
        // Use chunked upload approach
        const result = await uploadFileInChunks(compressedFile, '/api/upload-drive-chunk', 2 * 1024 * 1024, trackProgress);
        
        if (!result.success || !result.fileId) {
          console.error("Chunked upload failed:", result.error);
          throw new Error(result.error || 'File upload failed');
        }
        
        fileId = result.fileId;
        directLink = result.directLink;
      } else {
        // Use regular upload for smaller files in development
        // Create FormData to send to the API
        const formData = new FormData()
        formData.append('file', compressedFile)
        
        // Upload to Google Drive through our API route
        console.log("Attempting to upload to Google Drive via API route...")
        const response = await fetch('/api/upload-drive', {
          method: 'POST',
          body: formData,
        })
        
        // Check for error response from the API
        if (!response.ok) {
          let errorMessage = 'Upload failed'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            console.error("API error response:", errorData)
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError)
          }
          throw new Error(errorMessage)
        }
        
        // Parse the successful response
        const data = await response.json()
        if (!data.success || !data.fileId) {
          throw new Error('Upload failed: No file ID received')
        }
        
        fileId = data.fileId;
        directLink = data.directLink;
      }
      
      setUploadProgress(100);
      setIsUploading(false);
      
      // Return the direct link that can be used to display the image
      return directLink || `https://drive.google.com/uc?export=view&id=${fileId}`;
    } catch (error: any) {
      setIsUploading(false)
      console.error("Upload error:", error)
      setError(`Upload error: ${error.message || 'Unknown error'}`)
      throw error
    }
  };
  
  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Handle add/edit event form change
  const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEventFormData(prev => ({ ...prev, [name]: value }))
  }

  // Format date for display
  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return ''
    
    try {
      const date = new Date(isoDate)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return isoDate // Return original string if parsing fails
    }
  }

  // Format time for display
  const formatTimeForDisplay = (timeString: string): string => {
    if (!timeString) return ''
    
    // If it already contains a dash, assume it's already formatted
    if (timeString.includes('-')) {
      return timeString
    }
    
    // Format each time
    const formatSingleTime = (time: string): string => {
      try {
        const [hours, minutes] = time.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const formattedHours = hours % 12 || 12 // Convert 0 to 12
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`
      } catch (error) {
        return time // Return original if parsing fails
      }
    }
    
    // Handle case where timeString contains a time range
    if (timeString.includes('-')) {
      const [startTime, endTime] = timeString.split('-').map(t => t.trim())
      return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`
    }
    
    return formatSingleTime(timeString)
  }

  // Convert 12-hour format to 24-hour format for input value
  const format12To24Hour = (time12h: string): string => {
    if (!time12h) return ''
    
    try {
      const [timePart, period] = time12h.split(' ')
      let [hours, minutes] = timePart.split(':').map(Number)
      
      if (period === 'PM' && hours < 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch (error) {
      return '' // Return empty string if parsing fails
    }
  }

  // Format date for input
  const formatDateForInput = (displayDate: string): string => {
    if (!displayDate) return ''
    
    try {
      const date = new Date(displayDate)
      return date.toISOString().split('T')[0]
    } catch (error) {
      return '' // Return empty string if parsing fails
    }
  }

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset the file input value to allow selecting the same file again
    e.target.value = ''
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.')
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }
    
    // Update form data with the file
    setEventFormData(prev => ({
      ...prev,
      image: file,
      imageUrl: '' // Clear any previous URL when a new file is selected
    }))
    
    // Create a preview of the image
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle add event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setEventLoading(true)
    setError('')
    setEventSuccess('')
    
    try {
      // Validate form data
      if (!eventFormData.title) {
        throw new Error('Event title is required')
      }
      if (!eventFormData.date) {
        throw new Error('Event date is required')
      }
      if (!eventFormData.time) {
        throw new Error('Event time is required')
      }
      if (!eventFormData.location) {
        throw new Error('Event location is required')
      }
      if (!eventFormData.description) {
        throw new Error('Event description is required')
      }
      
      // For new events, make sure an image is provided
      if (!isEditingEvent && !eventFormData.image && !eventFormData.imageUrl) {
        throw new Error('Event image is required')
      }
      
      let imageUrl = eventFormData.imageUrl;
      
      // Handle image upload if there's a new image selected
      if (eventFormData.image) {
        try {
          imageUrl = await uploadEventImage(eventFormData.image)
          console.log("Successfully uploaded image, URL:", imageUrl)
        } catch (uploadError: any) {
          console.error("Error during image upload:", uploadError)
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }
      }
      
      // Create new event data object
      const eventData = {
        title: eventFormData.title,
        date: eventFormData.date,
        time: eventFormData.time,
        location: eventFormData.location,
        description: eventFormData.description,
        category: eventFormData.category,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      }

      if (isEditingEvent && eventFormData.id) {
        // Update existing event
        await updateDoc(doc(db, 'events', eventFormData.id), {
          ...eventData,
          updatedAt: new Date().toISOString()
        })
        setEventSuccess('Event updated successfully!')
      } else {
        // Add new event
        await addDoc(collection(db, 'events'), eventData)
        setEventSuccess('Event added successfully!')
      }
      
      // Reset form
      setEventFormData({
        id: '',
        title: '',
        date: '',
        time: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        category: 'Book Launch',
        image: null,
        imageUrl: ''
      })
      setImagePreview(null)
      setIsAddingEvent(false)
      setIsEditingEvent(false)
      setSelectedEvent(null)
      
      // Refresh events list
      fetchEvents()
    } catch (err: any) {
      console.error('Error adding/updating event:', err)
      setError(err.message || 'Failed to add/update event')
    } finally {
      setEventLoading(false)
    }
  }

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    
    // Parse time string to extract start and end times
    let startTime = ''
    let endTime = ''
    
    if (event.time && event.time.includes('-')) {
      const [startPart, endPart] = event.time.split('-').map(t => t.trim())
      
      // Convert from 12-hour to 24-hour format if needed
      if (startPart.includes('AM') || startPart.includes('PM')) {
        startTime = format12To24Hour(startPart)
      } else {
        startTime = startPart
      }
      
      if (endPart.includes('AM') || endPart.includes('PM')) {
        endTime = format12To24Hour(endPart)
      } else {
        endTime = endPart
      }
    }
    
    // Use imageUrl property if it exists, otherwise fall back to image
    const imageSource = event.imageUrl || event.image || '';
    
    setEventFormData({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      startTime,
      endTime,
      location: event.location,
      description: event.description,
      category: event.category || 'Book Launch',
      image: null,
      imageUrl: imageSource
    })
    
    // Set image preview from existing image URL
    setImagePreview(imageSource)
    setIsEditingEvent(true)
    setIsAddingEvent(true)
  }

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      setEventLoading(true)
      setError('')
      setEventSuccess('')
      
      // Get the event details for the success message
      const eventToDelete = events.find(event => event.id === eventId)
      const eventTitle = eventToDelete?.title || 'Event'
      
      const eventRef = doc(db, 'events', eventId)
      await deleteDoc(eventRef)
      
      setEvents(prev => prev.filter(event => event.id !== eventId))
      
      setEventSuccess(`Event "${eventTitle}" deleted successfully!`)
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setEventSuccess('')
      }, 5000)
    } catch (error: any) {
      console.error('Error deleting event:', error)
      setError(`Failed to delete event: ${error.message || 'Unknown error'}`)
    } finally {
      setEventLoading(false)
    }
  }

  // Cancel event form
  const handleCancelEventForm = () => {
    setIsAddingEvent(false)
    setIsEditingEvent(false)
    setSelectedEvent(null)
    setEventFormData({
      id: '',
      title: '',
      date: '',
      time: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      category: 'Book Launch',
      image: null,
      imageUrl: ''
    })
    setImagePreview(null)
    setError('')
  }

  const filteredSubmissions = submissions.filter(sub => 
    filter === 'all' ? true : sub.status === filter
  )

  // Helper function to extract file ID from Google Drive URL
  const extractGoogleDriveFileId = (url: string): string | null => {
    if (!url) return null
    
    try {
      // Format: https://drive.google.com/file/d/FILE_ID/view
      if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/file\/d\/([^/]+)/)
        if (match && match[1]) return match[1]
      }
      
      // Format: https://drive.google.com/open?id=FILE_ID
      if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([^&]+)/)
        if (match && match[1]) return match[1]
      }
      
      // Format: https://drive.google.com/uc?export=view&id=FILE_ID
      if (url.includes('drive.google.com/uc?') && url.includes('id=')) {
        const match = url.match(/id=([^&]+)/)
        if (match && match[1]) return match[1]
      }
      
      // Format: Already a file ID (alphanumeric string)
      if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
        return url
      }
      
      return null
    } catch (error) {
      console.error('Error extracting Google Drive file ID:', error)
      return null
    }
  }
  
  // Convert Google Drive share link to direct image URL
  const getGoogleDriveDirectLink = (url: string): string => {
    const fileId = extractGoogleDriveFileId(url)
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`
    }
    // If not a Google Drive URL, return the URL unchanged
    return url
  }

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
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Submissions
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Events
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'submissions' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Submissions</h2>
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
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                          {submission.isPaid && submission.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleVerifyPayment(submission.id)}
                              disabled={updateLoading}
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify Payment
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="text-red-600 hover:text-red-900"
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
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Events Management</h2>
              {!isAddingEvent && (
                <button
                  onClick={() => setIsAddingEvent(true)}
                  className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                >
                  <FaPlus className="mr-2" /> Add New Event
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {eventSuccess && (
              <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-lg">
                {eventSuccess}
              </div>
            )}

            {isAddingEvent ? (
              <div className="bg-beige p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-primary mb-4">
                  {isEditingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Event Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={eventFormData.title}
                        onChange={handleEventFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={eventFormData.category}
                        onChange={handleEventFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="Book Launch">Book Launch</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Festival">Festival</option>
                        <option value="Reading">Reading</option>
                        <option value="Seminar">Seminar</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formatDateForInput(eventFormData.date)}
                        onChange={handleEventFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {eventFormData.date ? `Display format: ${formatDateForDisplay(eventFormData.date)}` : 'Please select a date'}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                        Time
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="startTime" className="block text-xs text-gray-500">Start</label>
                          <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={eventFormData.startTime || ''}
                            onChange={(e) => {
                              const { value } = e.target
                              setEventFormData(prev => {
                                const endTime = prev.endTime || ''
                                const newTimeValue = value && endTime ? `${value} - ${endTime}` : prev.time
                                return { 
                                  ...prev, 
                                  startTime: value,
                                  time: newTimeValue
                                }
                              })
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label htmlFor="endTime" className="block text-xs text-gray-500">End</label>
                          <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={eventFormData.endTime || ''}
                            onChange={(e) => {
                              const { value } = e.target
                              setEventFormData(prev => {
                                const startTime = prev.startTime || ''
                                const newTimeValue = startTime && value ? `${startTime} - ${value}` : prev.time
                                return { 
                                  ...prev, 
                                  endTime: value,
                                  time: newTimeValue
                                }
                              })
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {eventFormData.startTime && eventFormData.endTime ? 
                          `Display format: ${formatTimeForDisplay(eventFormData.startTime)} - ${formatTimeForDisplay(eventFormData.endTime)}` : 
                          'Please select start and end times'}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={eventFormData.location}
                        onChange={handleEventFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                        Event Image
                      </label>
                      <div className="mt-1 mb-2 p-3 bg-blue-50 rounded text-sm">
                        <p className="mb-2"><strong>Image Upload:</strong></p>
                        <p>Select an image from your device to upload directly to our cloud storage.</p>
                        <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF. Max size: 10MB</p>
                      </div>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary/90"
                      />
                      {isUploading && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Processing image...'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={eventFormData.description}
                      onChange={handleEventFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>

                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                      <div className="relative h-40 w-full md:w-1/2 lg:w-1/3">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="h-full w-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error(`Failed to load preview image: ${target.src}`);
                            // Try fallback URL format if the primary one fails
                            if (target.src.includes('drive.google.com')) {
                              const fileId = extractGoogleDriveFileId(target.src);
                              if (fileId) {
                                target.src = `https://lh3.googleusercontent.com/d/${fileId}`;
                              } else {
                                // If no file ID could be extracted, use data URI
                                target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E';
                              }
                            } else {
                              // If not a Google Drive URL or fallback fails, use placeholder
                              target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancelEventForm}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={eventLoading}
                      className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition duration-300 ${
                        eventLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {eventLoading ? 'Processing...' : isEditingEvent ? 'Update Event' : 'Add Event'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No events found.</p>
                    <button
                      onClick={() => setIsAddingEvent(true)}
                      className="inline-flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                    >
                      <FaPlus className="mr-2" /> Add First Event
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg shadow border overflow-hidden">
                        <div className="relative h-48">
                          <img
                            src={event.imageUrl || event.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error(`Failed to load image: ${target.src}`);
                              // Try fallback URL format if the primary one fails
                              if (target.src.includes('drive.google.com')) {
                                const fileId = extractGoogleDriveFileId(target.src);
                                if (fileId) {
                                  target.src = `https://lh3.googleusercontent.com/d/${fileId}`;
                                } else {
                                  // If no file ID could be extracted, use data URI
                                  target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E';
                                }
                              } else {
                                // If not a Google Drive URL or fallback fails, use placeholder
                                target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E';
                              }
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-secondary text-accent px-2 py-1 rounded-full text-xs">
                            {event.category}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-primary mb-2 line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="space-y-1 mb-3 text-sm">
                            <div className="flex items-center text-accent">
                              <FaCalendar className="w-4 h-4 mr-2" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center text-accent">
                              <FaClock className="w-4 h-4 mr-2" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center text-accent">
                              <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>
                          <p className="text-accent mb-4 text-sm line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Review Submission Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary">
                  {selectedSubmission.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setReviewNotes('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{selectedSubmission.category}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p>{selectedSubmission.description}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted By</p>
                  <p>{selectedSubmission.userEmail}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Manuscript</p>
                  <a 
                    href={selectedSubmission.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-accent underline"
                  >
                    View Manuscript
                  </a>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Set As Paid Content
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSubmission.isPaid}
                        onChange={(e) => setSelectedSubmission({
                          ...selectedSubmission,
                          isPaid: e.target.checked,
                          paymentStatus: e.target.checked ? 'pending' : 'none'
                        })}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    
                    {selectedSubmission.isPaid && (
                      <div className="flex items-center space-x-2">
                        <span>Price:</span>
                        <input
                          type="number"
                          value={selectedSubmission.price || 0}
                          onChange={(e) => setSelectedSubmission({
                            ...selectedSubmission,
                            price: Number(e.target.value)
                          })}
                          min="0"
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                        <span>INR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'rejected')}
                  disabled={updateLoading}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 ${
                    updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'approved')}
                  disabled={updateLoading}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 ${
                    updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}