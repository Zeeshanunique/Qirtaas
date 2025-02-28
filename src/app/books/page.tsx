'use client'

import { ReactNode, useEffect, useState, Suspense } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { StaticImport } from 'next/dist/shared/lib/get-img-props'
import { getGoogleDriveImageUrl } from '@/utils/imageUtils'
import { BOOK_CATEGORIES } from '@/constants/categories'
import BookSocial from '@/components/BookSocial'
import { useAuth } from '@/contexts/AuthContext'
import { incrementBookViews } from '@/utils/bookStats'
import ShareButton from '@/components/ShareButton'
import { useSearchParams, useRouter } from 'next/navigation'
import BookPopup from '@/components/BookPopup'

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
  likes: string[] // Array of user IDs who liked
  comments: {
    id: string
    userId: string
    userName: string
    text: string
    createdAt: string
  }[]
  views: number
}

function BooksList() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

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
          ...doc.data(),
          likes: doc.data().likes || [],
          comments: doc.data().comments || [],
          views: doc.data().views || 0
        })) as Book[]
        setBooks(booksData)

        // Track views only once when books are loaded
        booksData.forEach(book => {
          incrementBookViews(book.id, user?.uid)
        })
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [user]) // Add user as dependency to re-run when auth state changes

  useEffect(() => {
    const bookId = searchParams.get('bookId')
    if (bookId && books.length > 0) {
      const book = books.find(b => b.id === bookId)
      if (book) setSelectedBook(book)
    }
  }, [searchParams, books])

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    router.push(`/books?bookId=${book.id}`, { scroll: false })
  }

  const handleClosePopup = () => {
    setSelectedBook(null)
    router.push('/books', { scroll: false })
  }

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
    <>
      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => handleBookClick(book)}
            className="bg-beige rounded-lg shadow-lg overflow-hidden border border-secondary cursor-pointer hover:shadow-xl transition-shadow duration-300"
          >
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
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRseHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
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
                    href="https://docs.google.com/forms/d/11LRxMFCKnNtTYZIxsKjahMV4p3A-eb-0ISMDXlpVz1o/edit" // Replace with your actual Google Form URL
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary text-accent px-4 py-2 rounded-lg hover:bg-sand transition duration-300"
                  >
                    Buy Now
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
              <BookSocial
                bookId={book.id}
                likes={book.likes || []}
                comments={book.comments || []}
                views={book.views || 0}
              />
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <ShareButton
                    title={book.title}
                    description={`Check out "${book.title}" by ${book.author} on Qirtaas`}
                    url={`${window.location.origin}/books?bookId=${book.id}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Popup */}
      {selectedBook && (
        <BookPopup
          book={selectedBook}
          onClose={handleClosePopup}
        />
      )}
    </>
  )
}

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-playfair font-bold text-center mb-12 text-primary">Our Books</h1>

      {/* Categories */}
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <BooksList />
      </Suspense>

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