'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { getGoogleDriveImageUrl } from '@/utils/imageUtils'
import BookSocial from './BookSocial'
import ShareButton from './ShareButton'
import { Book } from '@/types/book'

interface BookPopupProps {
  book: Book
  onClose: () => void
}

export default function BookPopup({ book, onClose }: BookPopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-[500px]">
              <Image
                src={typeof book.cover === 'string' ? getGoogleDriveImageUrl(book.cover) : '/placeholder-cover.jpg'}
                alt={book.title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            
            <div>
              <div className="text-sm text-accent mb-2 font-arabic">{book.category}</div>
              <h2 className="text-3xl font-playfair font-bold mb-4 text-primary">{book.title}</h2>
              <p className="text-accent mb-4">by {book.name}</p>
              <p className="text-accent mb-6">{book.description}</p>
              
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold text-primary mr-3">
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
              </div>
              
              <div className="flex gap-4 mb-8">
                {book.isPaid ? (
                  <>
                    <a
                      href="https://docs.google.com/forms/d/11LRxMFCKnNtTYZIxsKjahMV4p3A-eb-0ISMDXlpVz1o/edit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-secondary text-accent px-6 py-3 rounded-lg hover:bg-sand transition duration-300 text-center"
                    >
                      Buy Now
                    </a>
                    {book.paymentStatus === 'verified' ? (
                      <a
                        href={book.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-primary text-beige px-6 py-3 rounded-lg hover:bg-primary/90 transition duration-300 text-center"
                      >
                        Read Now
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed"
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
                      className="flex-1 bg-primary text-beige px-6 py-3 rounded-lg hover:bg-primary/90 transition duration-300 text-center"
                    >
                      Read Now
                    </a>
                  </>
                )}
              </div>

              <BookSocial
                bookId={book.id}
                likes={book.likes || []}
                comments={book.comments || []}
                views={book.views || 0}
              />
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ShareButton
                  title={book.title}
                  description={`Check out "${book.title}" by ${book.name} on Qirtaas`}
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/books?bookId=${book.id}`} // Updated URL format
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}