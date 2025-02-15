import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Your Work - Qirtaas Publications',
  description: 'Submit your manuscripts, stories, and poetry to Qirtaas Publications',
}

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}