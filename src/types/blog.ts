export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  authorId: string
  authorName: string
  authorEmail: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  featuredImage?: string
  categories: string[]
  tags: string[]
  viewCount: number
  isCommentEnabled: boolean
  comments: BlogComment[]
  metaDescription?: string
  publishDate?: string
}

export interface BlogComment {
  id: string
  postId: string
  authorName: string
  authorEmail: string
  content: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  parentCommentId?: string
  replies?: BlogComment[]
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  postCount: number
  createdAt: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  postCount: number
  createdAt: string
}

export interface BlogFormData {
  title: string
  content: string
  excerpt: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  categories: string[]
  tags: string[]
  featuredImage?: string
  isCommentEnabled: boolean
  metaDescription?: string
  publishDate?: string
}

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  totalComments: number
  recentPosts: BlogPost[]
} 