import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Books - Qirtaas Publications',
  description: 'Explore our collection of published books at Qirtaas Publications',
}

// Sample book data - in a real app, this would come from a database
const books = [
  {
    id: 1,
    title: 'The Art of Storytelling',
    author: 'Sarah Johnson',
    cover: 'https://www.picmaker.com/assets/images/bookcovermaker/template-1.png',
    description: 'A comprehensive guide to crafting compelling narratives that captivate readers from start to finish.',
    category: 'Non-Fiction',
    price: '$24.99'
  },
  {
    id: 2,
    title: 'Echoes of Dawn',
    author: 'Michael Chen',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'An enchanting tale of discovery and redemption set against the backdrop of a mystical sunrise.',
    category: 'Fiction',
    price: '$19.99'
  },
  {
    id: 3,
    title: 'Poetry in Motion',
    author: 'Emma Roberts',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'A collection of contemporary poems that explore the rhythm and movement of modern life.',
    category: 'Poetry',
    price: '$15.99'
  }
]

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-playfair font-bold text-center mb-12 text-primary">Our Books</h1>

      {/* Categories */}
      <div className="flex justify-center gap-4 mb-8">
        <button className="px-4 py-2 bg-secondary text-accent rounded-lg hover:bg-sand transition duration-300">All Books</button>
        <button className="px-4 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300">Fiction</button>
        <button className="px-4 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300">Non-Fiction</button>
        <button className="px-4 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300">Poetry</button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map((book) => (
          <div key={book.id} className="bg-beige rounded-lg shadow-lg overflow-hidden border border-secondary">
            <div className="relative h-[400px]">
              <Image
                src={book.cover}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6">
              <div className="text-sm text-accent mb-2 font-arabic">{book.category}</div>
              <h3 className="text-xl font-playfair font-bold mb-2 text-primary">{book.title}</h3>
              <p className="text-accent mb-2">by {book.author}</p>
              <p className="text-accent mb-4">{book.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">{book.price}</span>
                <button className="bg-secondary text-accent px-4 py-2 rounded-lg hover:bg-sand transition duration-300">
                  Order Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Collections */}
      <div className="mt-16">
        <h2 className="text-3xl font-playfair font-bold text-center mb-8 text-primary">Featured Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-beige p-6 rounded-lg shadow-lg border border-secondary">
            <h3 className="text-xl font-playfair font-bold mb-4 text-primary">New Releases</h3>
            <p className="text-accent mb-4">
              Discover our latest publications, featuring emerging voices and established authors.
            </p>
            <button className="text-primary hover:text-secondary transition duration-300">
              Explore New Releases →
            </button>
          </div>
          <div className="bg-beige p-6 rounded-lg shadow-lg border border-secondary">
            <h3 className="text-xl font-playfair font-bold mb-4 text-primary">Award Winners</h3>
            <p className="text-accent mb-4">
              Browse through our collection of critically acclaimed and award-winning titles.
            </p>
            <button className="text-primary hover:text-secondary transition duration-300">
              View Award Winners →
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="mt-16 bg-gradient-to-r from-primary to-accent rounded-lg p-8 text-center">
        <h2 className="text-2xl font-playfair font-bold mb-4 text-beige">Stay Updated</h2>
        <p className="text-beige mb-6">
          Subscribe to our newsletter to receive updates about new releases and special offers.
        </p>
        <div className="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg border-secondary focus:border-secondary focus:ring-secondary bg-beige text-accent"
          />
          <button className="bg-secondary text-accent px-6 py-2 rounded-lg hover:bg-sand transition duration-300">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  )
}