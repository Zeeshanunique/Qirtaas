import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Qirtaas Publications',
  description: 'Learn about Qirtaas Publications - The Bridge between authors and readers',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-playfair font-bold text-center mb-12">About Qirtaas Publications</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-playfair font-bold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-6">
            We take your dream drafts and polish them into literary gems. As the Bridge between authors and readers, 
            we design, print and market books so that authors can focus on creating new manuscripts for the readers.
          </p>
          <p className="text-gray-700">
            We are the Guardian of Great Stories, committed to bringing exceptional literary works to life through 
            our comprehensive publishing services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700">
              To provide a platform that transforms promising manuscripts into polished publications, 
              while maintaining the highest standards of quality and professionalism in the industry.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-700">
              To be the leading publishing house that discovers and nurtures literary talent, 
              creating a lasting impact on the world of literature.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-playfair font-bold mb-6">Our Publishing Process</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Submission</h3>
              <p className="text-gray-700">Submit your query letter, synopsis, and first three chapters.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">2. Review</h3>
              <p className="text-gray-700">Our editorial team evaluates your submission for potential publication.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">3. Proposal</h3>
              <p className="text-gray-700">If accepted, we'll send you a detailed proposal outlining terms and services.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">4. Editing and Production</h3>
              <p className="text-gray-700">Our team works with you to edit, design, and format your book.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">5. Publication</h3>
              <p className="text-gray-700">Your book is published in various formats and distributed to retailers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}