'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Home() {
  const { user, loading, isAdmin } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <section className="bg-gradient-to-r from-primary to-accent text-beige py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-end mb-4">
            {loading ? (
              <div className="animate-pulse bg-secondary/50 h-10 w-24 rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-beige">{user.email}</span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-primary hover:bg-primary/90 text-beige font-bold py-2 px-4 rounded-lg transition duration-300"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-secondary hover:bg-sand text-accent font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-secondary hover:bg-sand text-accent font-bold py-2 px-4 rounded-lg transition duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-playfair font-bold mb-6">
              From Manuscript to Masterpiece
            </h1>
            <p className="text-xl mb-8 font-arabic">
              We take your dream drafts and polish them into literary gems. The Bridge between authors and readers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/submit" className="bg-secondary hover:bg-sand text-accent font-bold py-3 px-6 rounded-lg transition duration-300">
                Submit Write up
              </Link>
              <Link href="/profile" className="bg-beige hover:bg-white text-primary font-bold py-3 px-6 rounded-lg border-2 border-secondary transition duration-300">
                Your Profile
              </Link>
              <Link href="/books" className="bg-beige hover:bg-white text-primary font-bold py-3 px-6 rounded-lg border-2 border-secondary transition duration-300">
                Reading Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}

      {/* Services Section */}
      <section className="py-20 bg-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent text-center mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-secondary">
              <h3 className="text-xl font-bold mb-4 text-primary">Book Publishing</h3>
              <p className="text-accent">Professional editing, design, and distribution services for your manuscript.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">eBook Creation</h3>
              <p className="text-gray-600">Convert your work into digital formats for wider reach.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Magazine Publishing</h3>
              <p className="text-gray-600">Regular publication of magazines with quality content.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-beige to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-6">
              Ready to Share Your Story?
            </h2>
            <p className="text-xl text-accent mb-8">
              Join our community of writers and readers. Let's bring your story to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/events" className="bg-secondary hover:bg-sand text-accent font-bold py-3 px-6 rounded-lg transition duration-300">
                Join Events
              </Link>
              <Link href="/contact" className="border-2 border-primary text-primary hover:bg-primary hover:text-beige font-bold py-3 px-6 rounded-lg transition duration-300">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}