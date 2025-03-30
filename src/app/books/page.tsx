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
  name: string
  isPaid: boolean
  paymentStatus: 'pending' | 'verified' | 'none'
}

// Add searchQuery as a prop to BooksList
function BooksList({ selectedCategory, searchQuery }: { selectedCategory: string, searchQuery: string }) {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
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
          views: doc.data().views || 0,
          isPaid: doc.data().isPaid || false,
          paymentStatus: doc.data().paymentStatus || 'none'
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

  // Update the filtering logic to include search
  const filteredBooks = books
    .filter(book => 
      // Category filter
      (selectedCategory === 'all' || book.category.toLowerCase() === selectedCategory.toLowerCase())
      &&
      // Search filter
      (searchQuery === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof book.author === 'string' && book.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof book.name === 'string' && book.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )

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
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFDQJYu4jlUQAAAABJRU5ErkJggg=="
                />
              )}
            </div>
            <div className="p-6">
              <div className="text-sm text-accent mb-2 font-arabic">{book.category}</div>
              <h3 className="text-xl font-playfair font-bold mb-2 text-primary">{book.title}</h3>
              <p className="text-accent mb-2">by {book.name}</p>
              <p className="text-accent mb-4">{book.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">
                  {book.isPaid ? (
                    <span className="flex items-center">
                      {typeof book.price === 'string' || typeof book.price === 'number' ? book.price : ''} INR
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        book.paymentStatus === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {book.paymentStatus === 'verified' ? 'Verified' : 'Payment Required'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-green-600">Free</span>
                  )}
                </span>
                <div className="flex gap-2">
                  {book.isPaid ? (
                    <>
                      <a
                        href="https://docs.google.com/forms/d/11LRxMFCKnNtTYZIxsKjahMV4p3A-eb-0ISMDXlpVz1o/edit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-secondary text-accent px-4 py-2 rounded-lg hover:bg-sand transition duration-300"
                      >
                        Buy Now
                      </a>
                      {book.paymentStatus === 'verified' ? (
                        <a
                          href={book.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary text-beige px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                        >
                          Read Now
                        </a>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                        >
                          Payment Pending
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <a
                        href={book.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary text-beige px-4 py-2 rounded-lg hover:bg-primary/90 transition duration-300"
                      >
                        Read Now
                      </a>
                    </>
                  )}
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
                    description={`Check out "${book.title}" by ${book.name} on Qirtaas`}
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-beige">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-playfair font-bold text-center mb-12 text-primary">
          Explore Our Books
        </h1>
        
        {/* Search Box */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-full border-gray-300 focus:ring-primary focus:border-primary bg-white"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {/* ... existing category buttons ... */}
        </div>
        
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }>
          <BooksList 
            selectedCategory={selectedCategory} 
            searchQuery={searchQuery} 
          />
        </Suspense>
      </div>
    </div>
  )
}