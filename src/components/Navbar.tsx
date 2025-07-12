'use client'
import Link from 'next/link'
import { useState } from 'react'
import JoinUsButton from './JoinUsButton'
import { COMMUNITY_LINKS } from '@/constants/communityLinks'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-playfair font-bold text-primary">
            Qirtaas Publications
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-secondary">Home</Link>
            <Link href="/about" className="text-gray-700 hover:text-secondary">About</Link>
            <Link href="/services" className="text-gray-700 hover:text-secondary">Services</Link>
            <Link href="/books" className="text-gray-700 hover:text-secondary">Books</Link>
            <Link href="/blog" className="text-gray-700 hover:text-secondary">Blog</Link>
            <Link href="/submit" className="text-gray-700 hover:text-secondary">Submit</Link>
            <Link href="/events" className="text-gray-700 hover:text-secondary">Events</Link>
            <Link href="/contact" className="text-gray-700 hover:text-secondary">Contact</Link>
            <JoinUsButton variant="secondary" size="sm" />
          </div>
          <button 
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-3">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-700 hover:text-secondary px-2 py-1">Home</Link>
              <Link href="/about" className="text-gray-700 hover:text-secondary px-2 py-1">About</Link>
              <Link href="/services" className="text-gray-700 hover:text-secondary px-2 py-1">Services</Link>
              <Link href="/books" className="text-gray-700 hover:text-secondary px-2 py-1">Books</Link>
              <Link href="/blog" className="text-gray-700 hover:text-secondary px-2 py-1">Blog</Link>
              <Link href="/submit" className="text-gray-700 hover:text-secondary px-2 py-1">Submit</Link>
              <Link href="/events" className="text-gray-700 hover:text-secondary px-2 py-1">Events</Link>
              <Link href="/contact" className="text-gray-700 hover:text-secondary px-2 py-1">Contact</Link>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-2 py-1 text-sm font-medium text-gray-600">Join Our Communities</div>
                <a href={COMMUNITY_LINKS.bookClubUrdu.url} className="text-gray-700 hover:text-secondary px-2 py-1 text-sm block">
                  {COMMUNITY_LINKS.bookClubUrdu.icon} {COMMUNITY_LINKS.bookClubUrdu.label}
                </a>
                <a href={COMMUNITY_LINKS.bookClubEnglish.url} className="text-gray-700 hover:text-secondary px-2 py-1 text-sm block">
                  {COMMUNITY_LINKS.bookClubEnglish.icon} {COMMUNITY_LINKS.bookClubEnglish.label}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}