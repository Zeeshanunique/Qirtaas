import { ReactNode } from 'react'
import { StaticImport } from 'next/dist/shared/lib/get-img-props'

export interface Book {
  price: ReactNode
  author: ReactNode
  cover: string | StaticImport
  id: string
  title: string
  description: string
  category: string
  fileUrl: string
  userEmail: string
  name: string
  likes: string[]
  comments: {
    id: string
    userId: string
    userName: string
    text: string
    createdAt: string
  }[]
  views: number
  isPaid: boolean
  paymentStatus: 'pending' | 'verified' | 'none'
}