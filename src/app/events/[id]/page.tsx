'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FaCalendar, FaMapMarkerAlt, FaClock, FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  category: string
  image?: string
  imageUrl: string
  createdAt: string
  updatedAt?: string
}

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

export default function EventDetail({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      try {
        const eventRef = doc(db, 'events', params.id)
        const eventDoc = await getDoc(eventRef)
        
        if (eventDoc.exists()) {
          setEvent({
            id: eventDoc.id,
            ...eventDoc.data()
          } as Event)
        } else {
          setError('Event not found')
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-beige py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">{error || 'Event not found'}</h1>
          <p className="text-accent mb-8">The event you're looking for may have been removed or doesn't exist.</p>
          <Link 
            href="/events" 
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-20">
      <div className="container mx-auto px-4">
        <Link 
          href="/events" 
          className="inline-flex items-center text-primary hover:text-accent mb-8"
        >
          <FaArrowLeft className="mr-2" /> Back to Events
        </Link>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="relative h-[40vh]">
            <img
              src={event.imageUrl || event.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3EImage%20not%20available%3C%2Ftext%3E%3C%2Fsvg%3E'}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error(`Failed to load event image: ${target.src}`);
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
            <div className="absolute top-4 right-4 bg-secondary text-accent px-3 py-1 rounded-full text-sm font-medium">
              {event.category}
            </div>
          </div>
          
          <div className="p-8">
            <h1 className="text-3xl font-playfair font-bold text-primary mb-6">
              {event.title}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-200 pb-8">
              <div className="flex items-start">
                <div className="bg-secondary/20 p-3 rounded-full mr-4">
                  <FaCalendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-accent mb-1">Date</h3>
                  <p className="text-lg text-primary">{event.date}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-secondary/20 p-3 rounded-full mr-4">
                  <FaClock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-accent mb-1">Time</h3>
                  <p className="text-lg text-primary">{event.time}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-secondary/20 p-3 rounded-full mr-4">
                  <FaMapMarkerAlt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-accent mb-1">Venue</h3>
                  <p className="text-lg text-primary">{event.location}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold text-primary mb-4">About This Event</h2>
              <div className="prose prose-primary max-w-none text-accent">
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-medium rounded-lg hover:bg-primary/90 transition duration-300">
                Register for this Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 