'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost, BlogComment } from '@/types/blog'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/utils/adminAuth'
import Image from 'next/image'
import Link from 'next/link'
import { FaCalendar, FaUser, FaEye, FaComment, FaTag, FaShare, FaArrowLeft, FaFacebook, FaTwitter, FaLinkedin, FaExclamationTriangle } from 'react-icons/fa'
import { notFound } from 'next/navigation'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { user } = useAuth()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [postNotFound, setPostNotFound] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [viewCounted, setViewCounted] = useState(false)

  useEffect(() => {
    setViewCounted(false) // Reset view count flag for new post
    fetchPost()
  }, [params.slug])

  useEffect(() => {
    if (post && !viewCounted) {
      incrementViewCount()
      fetchRelatedPosts()
      setViewCounted(true)
    }
  }, [post, viewCounted])

  const fetchPost = async () => {
    try {
      // First try to get published posts
      let q = query(
        collection(db, 'posts'),
        where('slug', '==', params.slug),
        where('status', '==', 'published')
      )
      let querySnapshot = await getDocs(q)
      
      // If no published post found, try to get draft posts (for preview)
      if (querySnapshot.empty) {
        q = query(
          collection(db, 'posts'),
          where('slug', '==', params.slug)
        )
        querySnapshot = await getDocs(q)
        
        // If still no post found, show 404
        if (querySnapshot.empty) {
          setPostNotFound(true)
          setLoading(false)
          return
        }
        
        // Check if the found post is a draft
        const postData = querySnapshot.docs[0].data()
        if (postData.status === 'draft') {
          // For draft posts, only show if user is the author or admin
          if (user && (user.email === postData.authorEmail || isAdmin(user.email))) {
            // Show draft post with preview notice
            setPost({
              id: querySnapshot.docs[0].id,
              ...postData
            } as BlogPost)
          } else {
            // User is not authorized to view this draft
            setPostNotFound(true)
            setLoading(false)
            return
          }
        } else {
          // Post exists but is not published and not draft (archived)
          setPostNotFound(true)
          setLoading(false)
          return
        }
      } else {
        // Published post found
        const postData = querySnapshot.docs[0]
        setPost({
          id: postData.id,
          ...postData.data()
        } as BlogPost)
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const incrementViewCount = async () => {
    if (!post) return
    
    try {
      const postRef = doc(db, 'posts', post.id)
      await updateDoc(postRef, {
        viewCount: increment(1)
      })
      // Don't update local state to prevent infinite loop
      // The updated view count will be fetched on next page load
    } catch (error) {
      console.error('Error updating view count:', error)
    }
  }

  const fetchRelatedPosts = async () => {
    if (!post) return
    
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published')
      )
      const querySnapshot = await getDocs(q)
      const allPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[]
      
      // Filter related posts by shared categories or tags
      const related = allPosts
        .filter(p => p.id !== post.id)
        .filter(p => 
          p.categories.some(cat => post.categories.includes(cat)) ||
          p.tags.some(tag => post.tags.includes(tag))
        )
        .slice(0, 3)
      
      setRelatedPosts(related)
    } catch (error) {
      console.error('Error fetching related posts:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || !post) return

    setIsSubmittingComment(true)
    try {
      const comment: BlogComment = {
        id: Date.now().toString(),
        postId: post.id,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email || '',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        status: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
      }

      const postRef = doc(db, 'posts', post.id)
      await updateDoc(postRef, {
        comments: arrayUnion(comment)
      })

      setPost(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), comment]
      } : null)
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const sharePost = (platform: 'facebook' | 'twitter' | 'linkedin' | 'copy') => {
    const url = window.location.href
    const title = post?.title || ''
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
    setShowShareMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-beige py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading post...</p>
          </div>
        </div>
      </div>
    )
  }

  if (postNotFound || !post) {
    return (
      <div className="min-h-screen bg-beige py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-primary hover:text-accent mb-8 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Blog
          </Link>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl text-gray-300 mb-4">📝</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              href="/blog"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition duration-300"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link 
          href="/blog" 
          className="inline-flex items-center text-primary hover:text-accent mb-8 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Blog
        </Link>

        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {post.featuredImage && (
            <div className="relative h-64 md:h-96 w-full">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <div className="p-8">
            {/* Post Meta */}
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4 gap-4">
              <div className="flex items-center">
                <FaCalendar className="mr-2" />
                {formatDate(post.publishedAt || post.createdAt)}
              </div>
              <div className="flex items-center">
                <FaUser className="mr-2" />
                {post.authorName}
              </div>
              <div className="flex items-center">
                <FaEye className="mr-2" />
                {post.viewCount} views
              </div>
              <div className="flex items-center">
                <FaComment className="mr-2" />
                {post.comments?.length || 0} comments
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-6">
              {post.title}
            </h1>

            {/* Preview Notice for Draft Posts */}
            {post.status === 'draft' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-400 mr-2" />
                  <div>
                    <p className="text-yellow-800 font-medium">Preview Mode</p>
                    <p className="text-yellow-700 text-sm">
                      This is a draft post and is only visible to you. Publish it to make it visible to everyone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Categories and Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories?.map(category => (
                <span key={category} className="bg-primary text-white px-3 py-1 text-sm rounded-full">
                  {category}
                </span>
              ))}
              {post.tags?.map(tag => (
                <span key={tag} className="bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded-full flex items-center">
                  <FaTag className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Share Button */}
            <div className="relative mb-6">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center bg-secondary text-accent px-4 py-2 rounded-lg hover:bg-sand transition duration-300"
              >
                <FaShare className="mr-2" />
                Share Post
              </button>
              
              {showShareMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-2 z-10">
                  <button
                    onClick={() => sharePost('facebook')}
                    className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    <FaFacebook className="mr-2 text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => sharePost('twitter')}
                    className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    <FaTwitter className="mr-2 text-blue-400" />
                    Twitter
                  </button>
                  <button
                    onClick={() => sharePost('linkedin')}
                    className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    <FaLinkedin className="mr-2 text-blue-700" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() => sharePost('copy')}
                    className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
              <style dangerouslySetInnerHTML={{
                __html: `
                  .blog-content h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 1.5rem 0;
                    color: #1f2937;
                  }
                  .blog-content h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 1.25rem 0;
                    color: #1f2937;
                  }
                  .blog-content h3 {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin: 1rem 0;
                    color: #1f2937;
                  }
                  .blog-content p {
                    margin: 0.75rem 0;
                    line-height: 1.6;
                  }
                  .blog-content ul, .blog-content ol {
                    margin: 0.75rem 0;
                    padding-left: 1.5rem;
                  }
                  .blog-content li {
                    margin: 0.25rem 0;
                  }
                  .blog-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                  }
                  .blog-content a:hover {
                    color: #1d4ed8;
                  }
                  .blog-content strong {
                    font-weight: bold;
                  }
                  .blog-content em {
                    font-style: italic;
                  }
                  .blog-content hr {
                    border: none;
                    border-top: 1px solid #e5e7eb;
                    margin: 1.5rem 0;
                  }
                  .blog-content blockquote {
                    border-left: 4px solid #e5e7eb;
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    font-style: italic;
                    color: #6b7280;
                  }
                `
              }} />
              <div 
                dangerouslySetInnerHTML={{ __html: post.content }}
                className="blog-content"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}
              />
            </div>
          </div>
        </article>

        {/* Comments Section */}
        {post.isCommentEnabled && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-primary mb-6">
              Comments ({post.comments?.length || 0})
            </h3>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Share your thoughts..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition duration-300"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-600">
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link> to leave a comment.
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {post.comments?.filter(comment => comment.status === 'approved').map((comment) => (
                <div key={comment.id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-900">{comment.authorName}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
              
              {(!post.comments || post.comments.length === 0) && (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Related Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {relatedPost.featuredImage && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={relatedPost.featuredImage}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-primary mb-2 hover:text-accent transition-colors">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 