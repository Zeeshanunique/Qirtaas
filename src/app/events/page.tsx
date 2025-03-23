'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FaCalendar, FaMapMarkerAlt, FaClock } from 'react-icons/fa'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const q = query(
          collection(db, 'events'),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[]
        setEvents(eventsData)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const categories = ['all', ...Array.from(new Set(events.map(event => event.category)))]
  
  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.category === filter)

  return (
    <div className="min-h-screen bg-beige">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center bg-gradient-to-r from-primary/90 to-primary">
        <div className="absolute inset-0 bg-[url('/images/banner-bg.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4">Events & Gatherings</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Join us for literary events, book launches, and cultural celebrations
          </p>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${filter === category 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-accent hover:bg-gray-100'}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="relative h-48">
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
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-3">
                      {event.title}
                    </h3>
                    <div className="space-y-2 mb-4">
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
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <p className="text-accent mb-6">
                      {event.description.length > 150 
                        ? `${event.description.substring(0, 150)}...` 
                        : event.description}
                    </p>
                    <Link href={`/events/${event.id}`} className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition duration-300">
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-accent">No events found.</p>
              <p className="text-lg text-accent mt-2">Please check back later for upcoming events.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}