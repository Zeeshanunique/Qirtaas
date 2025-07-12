'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost } from '@/types/blog'
import Image from 'next/image'
import Link from 'next/link'
import { FaCalendar, FaUser, FaEye, FaComment, FaSearch, FaTag } from 'react-icons/fa'

const POSTS_PER_PAGE = 6

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    fetchPosts()
    fetchCategoriesAndTags()
  }, [])

  const fetchPosts = async (reset = true) => {
    try {
      setLoading(true)
      
      // Query all posts first, then filter in the app
      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE * 2) // Get more posts to account for filtering
      )

      if (!reset && lastVisible) {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE * 2)
        )
      }

      const querySnapshot = await getDocs(q)
      
      const allPosts = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        }
      }) as BlogPost[]

      // Filter published posts client-side
      const newPosts = allPosts.filter(post => post.status === 'published').slice(0, POSTS_PER_PAGE)

      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }

      // Update pagination
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null)
      setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE * 2) // Check if we got max docs
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoriesAndTags = async () => {
    try {
      const q = query(collection(db, 'posts'))
      const querySnapshot = await getDocs(q)
      
      const allCategories = new Set<string>()
      const allTags = new Set<string>()
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        // Only process published posts
        if (data.status === 'published') {
          if (data.categories) {
            data.categories.forEach((cat: string) => allCategories.add(cat))
          }
          if (data.tags) {
            data.tags.forEach((tag: string) => allTags.add(tag))
          }
        }
      })
      
      setCategories(Array.from(allCategories))
      setTags(Array.from(allTags))
    } catch (error) {
      console.error('Error fetching categories and tags:', error)
    }
  }

  const handleSearch = () => {
    // Implement search functionality
    fetchPosts(true)
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || post.categories.includes(selectedCategory)
    const matchesTag = !selectedTag || post.tags.includes(selectedTag)
    
    return matchesSearch && matchesCategory && matchesTag
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-beige py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-bold text-primary mb-4">Blog</h1>
          <p className="text-lg text-accent max-w-2xl mx-auto">
            Discover stories, insights, and thoughts from our community of writers and readers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>



        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {post.featuredImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FaCalendar className="mr-2" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </div>
                  
                  <h2 className="text-xl font-bold text-primary mb-3 hover:text-accent transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {truncateText(post.excerpt, 150)}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <FaUser className="mr-1" />
                      {post.authorName}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <FaEye className="mr-1" />
                        {post.viewCount}
                      </div>
                      <div className="flex items-center">
                        <FaComment className="mr-1" />
                        {post.comments?.length || 0}
                      </div>
                    </div>
                  </div>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          <FaTag className="mr-1" />
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{post.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No blog posts found matching your criteria.</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="text-center">
            <button
              onClick={() => fetchPosts(false)}
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition duration-300"
            >
              Load More Posts
            </button>
          </div>
        )}

        {loading && posts.length > 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  )
} 