'use client'

import { ReactNode, useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { StaticImport } from 'next/dist/shared/lib/get-img-props'
import { getGoogleDriveImageUrl } from '@/utils/imageUtils'

interface Book {
  price: ReactNode
  author: ReactNode
  cover: string | StaticImport
  id: string
  title: string
  description: string
  category: string
  fileUrl: string
  userEmail: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('status', '==', 'approved')
        )
        const querySnapshot = await getDocs(q)
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[]
        setBooks(booksData)
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  const filteredBooks = selectedCategory === 'all' 
    ? books 
    : books.filter(book => book.category.toLowerCase() === selectedCategory.toLowerCase())

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-playfair font-bold text-center mb-12 text-primary">Our Books</h1>

      {/* Categories */}
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition duration-300 ${
            selectedCategory === 'all' 
              ? 'bg-secondary text-accent' 
              : 'bg-beige text-primary hover:bg-sand hover:text-accent'
          }`}
        >
          All Books
        </button>
        {['Fiction', 'Non-Fiction', 'Poetry'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition duration-300 ${
              selectedCategory === category 
                ? 'bg-secondary text-accent' 
                : 'bg-beige text-primary hover:bg-sand hover:text-accent'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBooks.map((book) => (
          <div key={book.id} className="bg-beige rounded-lg shadow-lg overflow-hidden border border-secondary">
            <div className="relative h-[400px]">
              {imageErrors[book.id] ? (
                // Fallback placeholder with book title
                <div className="w-full h-full bg-gray-200 flex items-center justify-center p-4">
                  <div className="text-center">
                    <svg 
                      className="w-12 h-12 mx-auto mb-4 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {book.title}
                    </p>
                  </div>
                </div>
              ) : (
                <Image
                  src={typeof book.cover === 'string' ? getGoogleDriveImageUrl(book.cover) : '/placeholder-cover.jpg'}
                  alt={book.title}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => {
                    setImageErrors(prev => ({
                      ...prev,
                      [book.id]: true
                    }))
                  }}
                  onLoadingComplete={(image) => {
                    image.classList.remove('opacity-0')
                  }}
                  loading="lazy"
                  quality={75}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRseHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              )}
            </div>
            <div className="p-6">
              <div className="text-sm text-accent mb-2 font-arabic">{book.category}</div>
              <h3 className="text-xl font-playfair font-bold mb-2 text-primary">{book.title}</h3>
              <p className="text-accent mb-2">by {book.author}</p>
              <p className="text-accent mb-4">{book.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">{book.price}</span>
                <div className="flex gap-2">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdCw4cD8UXvs9UZsCTyKkmn2tPDh1gsakrgjmYX_hczy17QJw/viewform?usp=header" // Replace with your actual Google Form URL
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary text-accent px-4 py-2 rounded-lg hover:bg-sand transition duration-300"
                  >
                    Order Now
                  </a>
                  <a
                    href={book.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-beige px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                  >
                    Read Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Collections */}
      <div className="mt-16">
        <h2 className="text-3xl font-playfair font-bold text-center mb-8 text-primary">Featured Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-beige p-6 rounded-lg shadow-lg border border-secondary">
            <h3 className="text-xl font-playfair font-bold mb-4 text-primary">New Releases</h3>
            <p className="text-accent mb-4">
              Discover our latest publications, featuring emerging voices and established authors.
            </p>
            <button className="text-primary hover:text-secondary transition duration-300">
              Explore New Releases →
            </button>
          </div>
          <div className="bg-beige p-6 rounded-lg shadow-lg border border-secondary">
            <h3 className="text-xl font-playfair font-bold mb-4 text-primary">Award Winners</h3>
            <p className="text-accent mb-4">
              Browse through our collection of critically acclaimed and award-winning titles.
            </p>
            <button className="text-primary hover:text-secondary transition duration-300">
              View Award Winners →
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="mt-16 bg-gradient-to-r from-primary to-accent rounded-lg p-8 text-center">
        <h2 className="text-2xl font-playfair font-bold mb-4 text-beige">Stay Updated</h2>
        <p className="text-beige mb-6">
          Subscribe to our newsletter to receive updates about new releases and special offers.
        </p>
        <div className="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg border-secondary focus:border-secondary focus:ring-secondary bg-beige text-accent"
          />
          <button className="bg-secondary text-accent px-6 py-2 rounded-lg hover:bg-sand transition duration-300">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  )
}