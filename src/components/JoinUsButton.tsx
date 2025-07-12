'use client'

import { useState } from 'react'
import { FaUsers, FaBook, FaPen, FaChevronDown } from 'react-icons/fa'
import { COMMUNITY_LINKS } from '@/constants/communityLinks'

interface JoinUsButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function JoinUsButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}: JoinUsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const baseClasses = 'relative inline-flex items-center font-bold rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary',
    secondary: 'bg-secondary hover:bg-sand text-accent focus:ring-secondary',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary'
  }

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg'
  }

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FaUsers className="mr-2" />
        Join Us
        <FaChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                Join Our Communities
              </div>
              
              <a
                href={COMMUNITY_LINKS.bookClubUrdu.url}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaBook className="mr-3 text-primary" />
                <div>
                  <div className="font-medium">{COMMUNITY_LINKS.bookClubUrdu.label}</div>
                  <div className="text-sm text-gray-500">{COMMUNITY_LINKS.bookClubUrdu.description}</div>
                </div>
              </a>
              
              <a
                href={COMMUNITY_LINKS.bookClubEnglish.url}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaBook className="mr-3 text-secondary" />
                <div>
                  <div className="font-medium">{COMMUNITY_LINKS.bookClubEnglish.label}</div>
                  <div className="text-sm text-gray-500">{COMMUNITY_LINKS.bookClubEnglish.description}</div>
                </div>
              </a>
              
              <a
                href={COMMUNITY_LINKS.writersCommunity.url}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaPen className="mr-3 text-accent" />
                <div>
                  <div className="font-medium">{COMMUNITY_LINKS.writersCommunity.label}</div>
                  <div className="text-sm text-gray-500">{COMMUNITY_LINKS.writersCommunity.description}</div>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 