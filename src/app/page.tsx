'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import JoinUsButton from '@/components/JoinUsButton'
import { useBooks } from '@/hooks/useBooks'
import FeaturedBookCard from '@/components/FeaturedBookCard'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'


export default function Home() {
  const { user, loading, isAdmin } = useAuth()
  const { books, loading: booksLoading } = useBooks(8) // Fetch more books for slideshow

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
                <div className="flex items-center gap-2">
                  <span className="text-beige text-sm">{user.displayName || user.email}</span>
                  <div className="flex gap-2">
                    <Link
                      href="/profile"
                      className="bg-beige hover:bg-white text-primary font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                      Profile
                    </Link>
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
                </div>
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
              <Link href="/books" className="bg-beige hover:bg-white text-primary font-bold py-3 px-6 rounded-lg border-2 border-secondary transition duration-300">
                Reading Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent text-center mb-12">
            Featured Publications
          </h2>
          {booksLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-gradient-to-b from-beige to-white p-6 rounded-lg shadow-lg animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            // Swiper slideshow
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                loop={true}
                navigation={{
                  nextEl: '.swiper-button-next-custom',
                  prevEl: '.swiper-button-prev-custom',
                }}
                pagination={{
                  clickable: true,
                  el: '.swiper-pagination-custom',
                }}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                speed={1000}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                  },
                  1024: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                  },
                }}
                className="featured-books-swiper"
              >
                {books.map((book) => (
                  <SwiperSlide key={book.id}>
                    <FeaturedBookCard book={book} />
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Custom Navigation Buttons */}
              <button 
                className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-lg transition-all duration-300 -ml-4"
                aria-label="Previous books"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-lg transition-all duration-300 -mr-4"
                aria-label="Next books"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Custom Pagination */}
              <div className="swiper-pagination-custom mt-8 text-center"></div>
            </div>
          ) : (
            // Fallback when no books
            <div className="text-center py-12">
              <p className="text-accent text-lg">No featured books available at the moment.</p>
              <Link href="/books" className="text-primary hover:text-secondary underline mt-2 inline-block">
                Browse all books
              </Link>
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/books" className="bg-primary hover:bg-primary/90 text-beige font-bold py-3 px-6 rounded-lg transition duration-300">
              View All Books
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-beige">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold mb-2">100+</h3>
              <p className="text-lg">Books Published</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">200+</h3>
              <p className="text-lg">Authors Supported</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">10K+</h3>
              <p className="text-lg">Readers Reached</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">95%</h3>
              <p className="text-lg">Author Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent text-center mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-secondary hover:shadow-xl transition duration-300 group">
              <div className="bg-gradient-to-r from-primary to-accent w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <svg className="w-8 h-8 text-beige" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">Book Publishing</h3>
              <p className="text-accent leading-relaxed">Professional editing, design, and distribution services for your manuscript. From draft to bookshelf.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 group">
              <div className="bg-gradient-to-r from-secondary to-sand w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">eBook Creation</h3>
              <p className="text-accent leading-relaxed">Convert your work into digital formats for wider reach. Multi-platform compatibility ensured.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 group">
              <div className="bg-gradient-to-r from-accent to-primary w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300">
                <svg className="w-8 h-8 text-beige" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">Magazine Publishing</h3>
              <p className="text-accent leading-relaxed">Regular publication of magazines with quality content. Monthly editions with diverse themes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-white to-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent text-center mb-12">
            What Our Authors Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-beige font-bold">SA</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-primary">Sarah Ahmed</h4>
                  <p className="text-accent text-sm">Poetry Author</p>
                </div>
              </div>
              <p className="text-accent italic">"Qirtaas Publications turned my collection of poems into a beautiful book. Their attention to detail and professional guidance made the entire process seamless."</p>
              <div className="flex text-secondary mt-4">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary to-sand rounded-full flex items-center justify-center">
                  <span className="text-accent font-bold">MK</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-primary">Muhammad Khan</h4>
                  <p className="text-accent text-sm">Novel Writer</p>
                </div>
              </div>
              <p className="text-accent italic">"The team at Qirtaas helped me navigate the publishing world with confidence. My novel is now reaching readers across the country!"</p>
              <div className="flex text-secondary mt-4">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                  <span className="text-beige font-bold">FN</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-primary">Fatima Noor</h4>
                  <p className="text-accent text-sm">Short Story Writer</p>
                </div>
              </div>
              <p className="text-accent italic">"From editing to marketing, Qirtaas provided comprehensive support. They truly care about bringing quality literature to readers."</p>
              <div className="flex text-secondary mt-4">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-secondary to-sand">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent mb-6">
              Stay Updated
            </h2>
            <p className="text-xl text-accent mb-8">
              Subscribe to our newsletter for the latest book releases, author spotlights, and publishing tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 max-w-md px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-beige font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Subscribe
              </button>
            </form>
            <p className="text-accent text-sm mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
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
              <JoinUsButton variant="primary" size="lg" />
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