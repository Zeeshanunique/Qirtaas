'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isAdmin } from '@/utils/adminAuth'
import { FaCalendar, FaMapMarkerAlt, FaClock, FaTrash, FaEdit, FaPlus, FaBlog, FaEye, FaComment } from 'react-icons/fa'
import { BlogPost, BlogFormData, BlogCategory, BlogTag } from '@/types/blog'

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
  // Add field to track who the payment is for
  purchaserEmail?: string
  purchaserUid?: string
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
  registrationFormUrl?: string
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
  registrationFormUrl: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'submissions' | 'events' | 'blog'>('submissions')
  
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
    imageUrl: '',
    registrationFormUrl: ''
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [eventSuccess, setEventSuccess] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isAddingPost, setIsAddingPost] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogFormData, setBlogFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    status: 'draft',
    categories: [],
    tags: [],
    featuredImage: '',
    isCommentEnabled: true,
    metaDescription: '',
    publishDate: ''
  })
  const [blogFilter, setBlogFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([])
  const [blogTags, setBlogTags] = useState<BlogTag[]>([])

  // Variable declarations for fileUrl instead of directLink
  let fileId = '';
  let fileUrl = '';

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

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    try {
      setBlogLoading(true)
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[]
      setBlogPosts(postsData)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setBlogLoading(false)
    }
  }

  useEffect(() => {
    if (user && isAdmin(user.email) && activeTab === 'blog') {
      fetchBlogPosts()
    }
  }, [user, activeTab])

  // Sync content editor when editing existing posts or creating new ones
  useEffect(() => {
    const editor = document.getElementById('content-editor') as HTMLDivElement;
    if (editor && !editor.contains(document.activeElement)) {
      // Only sync if editor is not focused (not being actively edited)
      if (isEditingPost && selectedPost) {
        // Editing existing post - only set content if it's different and editor is not focused
        if (editor.innerHTML !== blogFormData.content && document.activeElement !== editor) {
          editor.innerHTML = blogFormData.content || '';
        }
      } else if (isAddingPost && !isEditingPost) {
        // Creating new post - only clear if editor is not focused
        if (document.activeElement !== editor) {
          editor.innerHTML = '';
          setBlogFormData(prev => ({ ...prev, content: '' }));
        }
      }
    }
  }, [isEditingPost, selectedPost, isAddingPost])

  // Handle payment verification
  const handleVerifyPayment = async (submissionId: string, purchaserEmail: string) => {
    if (!purchaserEmail) {
      alert('Please specify the purchaser email address')
      return
    }

    try {
      setUpdateLoading(true)
      
      // Create user-specific purchase record
      const purchaseData = {
        submissionId,
        purchaserEmail: purchaserEmail.toLowerCase(),
        purchasedAt: new Date().toISOString(),
        verifiedBy: user?.email,
        bookTitle: submissions.find(s => s.id === submissionId)?.title || 'Unknown'
      }

      await addDoc(collection(db, 'purchases'), purchaseData)

      // Update submission to mark payment as verified but don't make it globally accessible
      const submissionRef = doc(db, 'submissions', submissionId)
      await updateDoc(submissionRef, {
        paymentStatus: 'verified',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: user?.email,
        purchaserEmail: purchaserEmail.toLowerCase()
      })

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, paymentStatus: 'verified', purchaserEmail: purchaserEmail.toLowerCase() } 
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
  const uploadEventImage = async (file: File, trackProgress?: (progress: number) => void): Promise<string> => {
    try {
      setUploadProgress(0);
      setIsUploading(true);
      
      // Compress the image before upload
      const compressedFile = await compressImage(file);
      console.log(`Original size: ${Math.round(file.size / 1024)} KB, Compressed: ${Math.round(compressedFile.size / 1024)} KB`);
      
      // Check if file is large (2MB+) or if in Vercel production environment
      const isLargeFile = compressedFile.size > 2 * 1024 * 1024;
      const isVercel = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
        if (isLargeFile || isVercel) {
        console.log(`Using chunked upload for ${isLargeFile ? 'large file' : 'Vercel environment'}`);
        
        try {
          // Dynamically import the chunked upload utility only when needed
          const { uploadFileInChunks } = await import('@/lib/chunkedUpload');
          
          // Tracking progress function to update UI
          const trackProgress = (progress: number) => {
            setUploadProgress(progress);
          };
          
          // Convert Blob to File before uploading
          const fileForUpload = new File([compressedFile], file.name, { type: file.type });
          
          // Use chunked upload approach
          const result = await uploadFileInChunks(fileForUpload, '/api/upload-drive-chunk', 2 * 1024 * 1024, trackProgress);
          
          if (!result.success || !result.fileId) {
            console.error("Chunked upload failed:", result.error);
            throw new Error(result.error || 'Chunked upload failed');
          }
          
          fileId = result.fileId;
          fileUrl = result.fileUrl || '';
        } catch (chunkError: any) {
          console.warn('Chunked upload failed, falling back to simple upload:', chunkError.message);
          
          // Fallback to simple upload if file is under 10MB
          if (compressedFile.size <= 10 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', compressedFile);
            
            console.log("Attempting fallback to simple upload...");
            const response = await fetch('/api/upload-drive-simple', {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Simple upload fallback failed:', errorData);
              throw new Error(errorData.error || 'Both chunked and simple upload failed');
            }
            
            const data = await response.json();
            console.log('Simple upload fallback successful:', data);
            
            fileId = data.fileId;
            fileUrl = data.fileUrl;
          } else {
            throw new Error('File too large for simple upload fallback');
          }
        }
      } else {
        // Use regular upload for smaller files in development
        // Create FormData to send to the API
        const formData = new FormData()
        formData.append('file', compressedFile)
        
        // Upload to Google Drive through our API route
        console.log("Attempting to upload to Google Drive via API route...")
        const response = await fetch('/api/upload-drive', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload failed:', errorData);
          throw new Error(errorData.error || 'File upload failed');
        }
        
        const data = await response.json();
        console.log('Upload successful:', data);
        
        fileId = data.fileId;
        fileUrl = data.fileUrl;
      }
      
      // Update form state
      setIsUploading(false);
      setUploadProgress(100);
      
      // Return the direct link to the uploaded image
      return fileUrl || `https://drive.google.com/uc?export=view&id=${fileId}`;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(`Upload failed: ${error.message}`);
      setIsUploading(false);
      throw error;
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
        registrationFormUrl: eventFormData.registrationFormUrl || null,
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
        imageUrl: '',
        registrationFormUrl: ''
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
      imageUrl: imageSource,
      registrationFormUrl: event.registrationFormUrl || ''
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
      imageUrl: '',
      registrationFormUrl: ''
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

  // Blog management functions
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleBlogFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBlogFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-generate slug from title
      if (name === 'title') {
        updated.slug = generateSlug(value)
      }
      return updated
    })
  }

  const handleAddBlogPost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!blogFormData.title || !blogFormData.content) {
      setError('Title and content are required')
      return
    }

    try {
      setBlogLoading(true)
      const now = new Date().toISOString()
      
      // Ensure slug is properly generated
      const finalSlug = blogFormData.slug || generateSlug(blogFormData.title)
      
      const postData: Partial<BlogPost> = {
        title: blogFormData.title,
        content: blogFormData.content,
        excerpt: blogFormData.excerpt,
        slug: finalSlug,
        status: blogFormData.status,
        categories: blogFormData.categories || [],
        tags: blogFormData.tags || [],
        featuredImage: blogFormData.featuredImage || '',
        isCommentEnabled: blogFormData.isCommentEnabled,
        metaDescription: blogFormData.metaDescription || '',
        publishDate: blogFormData.publishDate || '',
        authorId: user?.uid || '',
        authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
        authorEmail: user?.email || '',
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        comments: []
      }

      // Only include publishedAt if the post is published
      if (blogFormData.status === 'published') {
        postData.publishedAt = blogFormData.publishDate || now
      }

      if (isEditingPost && selectedPost) {
        // Update existing post
        const postRef = doc(db, 'posts', selectedPost.id)
        await updateDoc(postRef, {
          ...postData,
          updatedAt: now
        })
        setBlogPosts(prev => prev.map(post => 
          post.id === selectedPost.id 
            ? { ...post, ...postData, updatedAt: now } as BlogPost
            : post
        ))
      } else {
        // Create new post
        const docRef = await addDoc(collection(db, 'posts'), postData)
        setBlogPosts(prev => [{ id: docRef.id, ...postData } as BlogPost, ...prev])
      }

      handleCancelBlogForm()
    } catch (error) {
      console.error('Error saving blog post:', error)
      setError('Failed to save blog post')
    } finally {
      setBlogLoading(false)
    }
  }

  const handleEditBlogPost = (post: BlogPost) => {
    setSelectedPost(post)
    setBlogFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      slug: post.slug,
      status: post.status,
      categories: post.categories,
      tags: post.tags,
      featuredImage: post.featuredImage || '',
      isCommentEnabled: post.isCommentEnabled,
      metaDescription: post.metaDescription || '',
      publishDate: post.publishDate || ''
    })
    setIsEditingPost(true)
    setIsAddingPost(true)
  }

  const handleDeleteBlogPost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return
    }

    try {
      setBlogLoading(true)
      const postRef = doc(db, 'posts', postId)
      await deleteDoc(postRef)
      setBlogPosts(prev => prev.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting blog post:', error)
      setError('Failed to delete blog post')
    } finally {
      setBlogLoading(false)
    }
  }

  const handleCancelBlogForm = () => {
    setIsAddingPost(false)
    setIsEditingPost(false)
    setSelectedPost(null)
    setBlogFormData({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      status: 'draft',
      categories: [],
      tags: [],
      featuredImage: '',
      isCommentEnabled: true,
      metaDescription: '',
      publishDate: ''
    })
    setError('')
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
              <button
                onClick={() => setActiveTab('blog')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'blog'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBlog className="inline mr-2" />
                Blog
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
                              {submission.paymentStatus === 'verified' && submission.purchaserEmail && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Purchased by: {submission.purchaserEmail}
                                </div>
                              )}
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
                              onClick={() => {
                                const purchaserEmail = prompt('Enter the purchaser\'s email address:')
                                if (purchaserEmail) {
                                  handleVerifyPayment(submission.id, purchaserEmail)
                                }
                              }}
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
                    </div>                    <div>
                      <label htmlFor="registrationFormUrl" className="block text-sm font-medium text-gray-700">
                        Registration Form URL (Optional)
                      </label>
                      <input
                        type="url"
                        id="registrationFormUrl"
                        name="registrationFormUrl"
                        value={eventFormData.registrationFormUrl}
                        onChange={handleEventFormChange}
                        placeholder="https://forms.google.com/..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Provide a Google Form or other registration URL for attendees to register for this event
                      </p>
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
                            </div>                            <div className="flex items-center text-accent">
                              <FaClock className="w-4 h-4 mr-2" />
                              <span>{formatTimeForDisplay(event.time)}</span>
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

        {activeTab === 'blog' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Blog Management</h2>
              {!isAddingPost && (
                <button
                  onClick={() => setIsAddingPost(true)}
                  className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                >
                  <FaPlus className="mr-2" /> Add New Post
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            )}

            {isAddingPost ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isEditingPost ? 'Edit Post' : 'Add New Post'}
                  </h3>
                </div>
                
                <form onSubmit={handleAddBlogPost} className="flex flex-col lg:flex-row">
                  {/* Main Content Area */}
                  <div className="flex-1 p-6 space-y-6">
                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={blogFormData.title}
                        onChange={handleBlogFormChange}
                        className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400 focus:ring-0 p-0"
                        placeholder="Enter post title here..."
                        required
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Permalink: <span className="text-primary">/blog/{blogFormData.slug || 'post-slug'}</span>
                      </div>
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 border-b border-gray-200 pb-2">
                        <span className="text-lg font-medium text-gray-700">Content</span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('bold', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors"
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('italic', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded italic transition-colors"
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const linkUrl = prompt('Enter link URL:');
                              if (linkUrl) {
                                document.execCommand('createLink', false, linkUrl);
                                const editor = document.getElementById('content-editor') as HTMLDivElement;
                                setBlogFormData(prev => ({
                                  ...prev,
                                  content: editor.innerHTML
                                }));
                                editor.focus();
                              }
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Add Link"
                          >
                            🔗
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('formatBlock', false, 'h2');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Heading 2"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('formatBlock', false, 'h3');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Heading 3"
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('insertUnorderedList', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Bullet List"
                          >
                            •
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('insertOrderedList', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Numbered List"
                          >
                            1.
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('insertHorizontalRule', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Horizontal Line"
                          >
                            ―
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('formatBlock', false, 'blockquote');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Blockquote"
                          >
                            "
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('undo', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Undo"
                          >
                            ↶
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.execCommand('redo', false, '');
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                              editor.focus();
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Redo"
                          >
                            ↷
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            #content-editor {
                              background: white;
                            }
                            #content-editor:empty:before {
                              content: attr(data-placeholder);
                              color: #9ca3af;
                              font-style: italic;
                              pointer-events: none;
                            }
                            #content-editor:focus:before {
                              display: none;
                            }
                            #content-editor h1 {
                              font-size: 2rem;
                              font-weight: bold;
                              margin: 1rem 0;
                              color: #1f2937;
                            }
                            #content-editor h2 {
                              font-size: 1.5rem;
                              font-weight: bold;
                              margin: 1rem 0;
                              color: #1f2937;
                            }
                            #content-editor h3 {
                              font-size: 1.25rem;
                              font-weight: bold;
                              margin: 0.75rem 0;
                              color: #1f2937;
                            }
                            #content-editor p {
                              margin: 0.5rem 0;
                              line-height: 1.6;
                            }
                            #content-editor ul, #content-editor ol {
                              margin: 0.5rem 0;
                              padding-left: 1.5rem;
                            }
                            #content-editor li {
                              margin: 0.25rem 0;
                            }
                            #content-editor a {
                              color: #3b82f6;
                              text-decoration: underline;
                            }
                            #content-editor a:hover {
                              color: #1d4ed8;
                            }
                            #content-editor strong {
                              font-weight: bold;
                            }
                            #content-editor em {
                              font-style: italic;
                            }
                            #content-editor hr {
                              border: none;
                              border-top: 1px solid #e5e7eb;
                              margin: 1rem 0;
                            }
                            #content-editor blockquote {
                              border-left: 4px solid #e5e7eb;
                              padding-left: 1rem;
                              margin: 1rem 0;
                              font-style: italic;
                              color: #6b7280;
                            }
                          `
                        }} />
                        <div
                          id="content-editor"
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onInput={(e) => {
                            const target = e.target as HTMLDivElement;
                            setBlogFormData(prev => ({
                              ...prev,
                              content: target.innerHTML
                            }));
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData?.getData('text/plain');
                            if (text) {
                              document.execCommand('insertText', false, text);
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle keyboard shortcuts
                            if (e.ctrlKey || e.metaKey) {
                              switch (e.key) {
                                case 'b':
                                  e.preventDefault();
                                  document.execCommand('bold', false, '');
                                  break;
                                case 'i':
                                  e.preventDefault();
                                  document.execCommand('italic', false, '');
                                  break;
                                case 'k':
                                  e.preventDefault();
                                  const linkUrl = prompt('Enter link URL:');
                                  if (linkUrl) {
                                    document.execCommand('createLink', false, linkUrl);
                                  }
                                  break;
                                case 'z':
                                  e.preventDefault();
                                  document.execCommand('undo', false, '');
                                  break;
                                case 'y':
                                  e.preventDefault();
                                  document.execCommand('redo', false, '');
                                  break;
                              }
                              const editor = document.getElementById('content-editor') as HTMLDivElement;
                              setBlogFormData(prev => ({
                                ...prev,
                                content: editor.innerHTML
                              }));
                            }
                          }}
                          onFocus={(e) => {
                            const target = e.target as HTMLDivElement;
                            if (target.innerHTML === '' || target.innerHTML === '<br>') {
                              target.innerHTML = '';
                            }
                          }}
                          onBlur={(e) => {
                            const target = e.target as HTMLDivElement;
                            if (target.innerHTML === '' || target.innerHTML === '<br>') {
                              target.innerHTML = '';
                              setBlogFormData(prev => ({
                                ...prev,
                                content: ''
                              }));
                            }
                          }}
                          className="w-full min-h-[400px] max-h-[600px] overflow-y-auto rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 p-4 text-base leading-6 outline-none prose prose-lg max-w-none"
                          style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            color: '#1f2937'
                          }}
                          data-placeholder={blogFormData.content === '' ? 'Start writing your post content here...' : ''}
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-500 shadow-sm">
                          {blogFormData.content.replace(/<[^>]*>/g, '').split(' ').filter(word => word.length > 0).length} words
                        </div>
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-500 shadow-sm">
                          WYSIWYG Editor
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                        <div className="font-medium text-gray-700 mb-1">💡 Editor Features:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <strong>Formatting:</strong> Bold, Italic, Headings, Lists, Links, Blockquotes
                          </div>
                          <div>
                            <strong>Keyboard Shortcuts:</strong> Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+K (Link), Ctrl+Z (Undo), Ctrl+Y (Redo)
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          ✨ This is a live WYSIWYG editor - what you see is what you get!
                        </div>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                        Excerpt
                      </label>
                      <textarea
                        id="excerpt"
                        name="excerpt"
                        value={blogFormData.excerpt}
                        onChange={handleBlogFormChange}
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        placeholder="Write a brief excerpt for your post..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Excerpts are optional hand-crafted summaries of your content that can be used in your theme.
                      </p>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">SEO Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Meta Description
                          </label>
                          <textarea
                            id="metaDescription"
                            name="metaDescription"
                            value={blogFormData.metaDescription || ''}
                            onChange={handleBlogFormChange}
                            rows={2}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            placeholder="A brief description for search engines..."
                            maxLength={160}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {(blogFormData.metaDescription || '').length}/160 characters
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="w-full lg:w-80 bg-gray-50 p-6 space-y-6">
                    {/* Publish */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Publish</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={blogFormData.status}
                            onChange={handleBlogFormChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Publish Date
                          </label>
                          <input
                            type="datetime-local"
                            id="publishDate"
                            name="publishDate"
                            value={blogFormData.publishDate || new Date().toISOString().slice(0, 16)}
                            onChange={handleBlogFormChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isCommentEnabled"
                            checked={blogFormData.isCommentEnabled}
                            onChange={(e) => setBlogFormData(prev => ({ ...prev, isCommentEnabled: e.target.checked }))}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="isCommentEnabled" className="text-sm text-gray-700">
                            Allow comments
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Categories & Tags */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Categories & Tags</h4>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">
                            Categories
                          </label>
                          <input
                            type="text"
                            id="categories"
                            name="categories"
                            value={blogFormData.categories?.join(', ') || ''}
                            onChange={(e) => setBlogFormData(prev => ({ 
                              ...prev, 
                              categories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat) 
                            }))}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            placeholder="Enter categories separated by commas"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={blogFormData.tags?.join(', ') || ''}
                            onChange={(e) => setBlogFormData(prev => ({ 
                              ...prev, 
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                            }))}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            placeholder="Enter tags separated by commas"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Featured Image</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            id="featuredImage"
                            name="featuredImage"
                            value={blogFormData.featuredImage}
                            onChange={handleBlogFormChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        
                        {blogFormData.featuredImage && (
                          <div className="mt-2">
                            <img 
                              src={blogFormData.featuredImage} 
                              alt="Featured image preview" 
                              className="w-full h-32 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Settings */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Post Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug
                          </label>
                          <input
                            type="text"
                            id="slug"
                            name="slug"
                            value={blogFormData.slug}
                            onChange={handleBlogFormChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            placeholder="post-url-slug"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This will be used in the URL. Use lowercase letters, numbers, and hyphens only.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="space-y-3">
                        <button
                          type="submit"
                          disabled={blogLoading}
                          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
                        >
                          {blogLoading ? 'Saving...' : (isEditingPost ? 'Update Post' : 'Publish Post')}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setBlogFormData({...blogFormData, status: 'draft'});
                            document.querySelector('form')?.requestSubmit();
                          }}
                          disabled={blogLoading}
                          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50 font-medium"
                        >
                          Save as Draft
                        </button>
                        
                        <button
                          type="button"
                          onClick={async () => {
                            if (!blogFormData.slug) {
                              alert('Please add a slug to preview the post');
                              return;
                            }
                            
                            if (!blogFormData.title || !blogFormData.content) {
                              alert('Please add a title and content to preview the post');
                              return;
                            }

                            try {
                              setBlogLoading(true);
                              
                              // Check if this is a new post or existing post
                              if (!isEditingPost || !selectedPost) {
                                // New post - save as draft first
                                const now = new Date().toISOString();
                                const postData: any = {
                                  ...blogFormData,
                                  status: 'draft', // Force draft status for preview
                                  authorId: user?.uid || '',
                                  authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
                                  authorEmail: user?.email || '',
                                  createdAt: now,
                                  updatedAt: now,
                                  viewCount: 0,
                                  comments: []
                                };

                                // Save as draft
                                const docRef = await addDoc(collection(db, 'posts'), postData);
                                setBlogPosts(prev => [{ id: docRef.id, ...postData } as BlogPost, ...prev]);
                                setSelectedPost({ id: docRef.id, ...postData } as BlogPost);
                                setIsEditingPost(true);
                                
                                // Now open preview
                                window.open(`/blog/${blogFormData.slug}`, '_blank');
                              } else {
                                // Existing post - update it first
                                const now = new Date().toISOString();
                                const postData: any = {
                                  ...blogFormData,
                                  authorId: user?.uid || '',
                                  authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
                                  authorEmail: user?.email || '',
                                  updatedAt: now,
                                  viewCount: selectedPost.viewCount || 0,
                                  comments: selectedPost.comments || []
                                };

                                // Include publishedAt if the post is published
                                if (blogFormData.status === 'published') {
                                  postData.publishedAt = blogFormData.publishDate || selectedPost.publishedAt || now;
                                }

                                const postRef = doc(db, 'posts', selectedPost.id);
                                await updateDoc(postRef, {
                                  ...postData,
                                  updatedAt: now
                                });
                                
                                setBlogPosts(prev => prev.map(post => 
                                  post.id === selectedPost.id 
                                    ? { ...post, ...postData, updatedAt: now } as BlogPost
                                    : post
                                ));
                                
                                // Now open preview
                                window.open(`/blog/${blogFormData.slug}`, '_blank');
                              }
                            } catch (error) {
                              console.error('Error saving post for preview:', error);
                              alert('Failed to save post for preview. Please try again.');
                            } finally {
                              setBlogLoading(false);
                            }
                          }}
                          disabled={blogLoading}
                          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50 font-medium"
                        >
                          {blogLoading ? 'Preparing Preview...' : 'Preview Post'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleCancelBlogForm}
                          className="w-full text-gray-500 py-2 px-4 rounded-md hover:text-gray-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <select
                    value={blogFilter}
                    onChange={(e) => setBlogFilter(e.target.value as typeof blogFilter)}
                    className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  >
                    <option value="all">All Posts</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {blogPosts
                        .filter(post => blogFilter === 'all' || post.status === blogFilter)
                        .map((post) => (
                        <tr key={post.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              /{post.slug}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${post.status === 'published' ? 'bg-green-100 text-green-800' : 
                                post.status === 'archived' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {post.authorName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaEye className="mr-1" />
                              {post.viewCount}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditBlogPost(post)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteBlogPost(post.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
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
          </div>
        )}
      </div>
    </div>
  )
}