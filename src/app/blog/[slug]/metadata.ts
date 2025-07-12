import { Metadata } from 'next'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost } from '@/types/blog'

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('slug', '==', params.slug),
      where('status', '==', 'published')
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        title: 'Post Not Found | Qirtaas',
        description: 'The requested blog post could not be found.'
      }
    }
    
    const post = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as BlogPost
    
    return {
      title: `${post.title} | Qirtaas Blog`,
      description: post.excerpt,
      keywords: post.tags?.join(', '),
      authors: [{ name: post.authorName }],
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt || post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [post.authorName],
        images: post.featuredImage ? [
          {
            url: post.featuredImage,
            alt: post.title
          }
        ] : undefined
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: post.featuredImage ? [post.featuredImage] : undefined
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Blog Post | Qirtaas',
      description: 'Read the latest blog post from our community of writers.'
    }
  }
} 