'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { getGoogleDriveImageUrl } from '@/utils/imageUtils'
import { Book } from '@/hooks/useBooks'

interface FeaturedBookCardProps {
  book: Book
}

export default function FeaturedBookCard({ book }: FeaturedBookCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="bg-gradient-to-b from-beige to-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
      <div className="relative h-48 rounded-lg mb-4 overflow-hidden">
        {imageError || !book.cover ? (
          <div className="w-full h-full bg-primary flex items-center justify-center">
            <span className="text-beige text-sm text-center px-2">{book.title}</span>
          </div>
        ) : (
          <Image
            src={getGoogleDriveImageUrl(book.cover)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => setImageError(true)}
            quality={75}
          />
        )}
      </div>
      <h3 className="text-lg font-bold mb-2 text-primary line-clamp-2">{book.title}</h3>
      <p className="text-accent text-sm mb-2">By {book.author || book.name}</p>
      <div className="flex justify-between items-center">
        <span className="text-secondary font-bold">
          {book.isPaid ? `₹${book.price}` : 'Free'}
        </span>
        <Link 
          href={`/books?bookId=${book.id}`} 
          className="bg-secondary hover:bg-sand text-accent text-sm px-3 py-1 rounded transition duration-300"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}