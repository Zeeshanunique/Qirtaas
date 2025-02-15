import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Qirtaas Publications',
  description: 'Sign in to your Qirtaas Publications account',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}