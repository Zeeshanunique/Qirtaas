'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  url: string
  description: string
}

export default function ShareButton({ title, url, description }: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url
        })
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(url)
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 2000)
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-300"
      >
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
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        <span className="text-sm">Share</span>
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
          Link copied!
        </div>
      )}
    </div>
  )
}