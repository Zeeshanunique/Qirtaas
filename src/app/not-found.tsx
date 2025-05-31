import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Qirtaas Publications',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-playfair font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-playfair font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to exploring our literary world.
        </p>
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Homepage
          </Link>
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Link 
              href="/books" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Browse Books
            </Link>
            <Link 
              href="/events" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              View Events
            </Link>
            <Link 
              href="/submit" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Submit Work
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
