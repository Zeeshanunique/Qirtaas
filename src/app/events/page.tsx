import { Metadata } from 'next'
import Image from 'next/image'
import { FaCalendar, FaMapMarkerAlt, FaClock, FaRegBookmark, FaChalkboardTeacher, FaUsers } from 'react-icons/fa'
import { MdEventAvailable } from 'react-icons/md'

export const metadata: Metadata = {
  title: 'Events - Qirtaas Publications',
  description: 'Literary events and workshops hosted by Qirtaas Publications',
}

const events = [
  {
    id: 1,
    title: 'Book Launch: The Art of Arabic Poetry',
    date: 'March 15, 2025',
    time: '6:00 PM - 8:00 PM',
    location: 'Qirtaas Cultural Center',
    image: '/images/events/poetry-launch.png',
    description: 'Join us for an evening of poetry and cultural celebration as we launch our latest anthology.',
    category: 'Book Launch'
  },
  {
    id: 2,
    title: 'Writers Workshop: Crafting Your Story',
    date: 'March 20, 2025',
    time: '2:00 PM - 5:00 PM',
    location: 'Virtual Event',
    image: '/images/events/poetry-launch.png',
    description: 'An interactive workshop for aspiring authors to develop their writing skills.',
    category: 'Workshop'
  },
  {
    id: 3,
    title: 'Literary Festival: Words Across Cultures',
    date: 'April 5-7, 2025',
    time: 'All Day',
    location: 'City Convention Center',
    image: '/images/events/poetry-launch.png',
    description: 'A three-day celebration of literature featuring readings, panels, and networking opportunities.',
    category: 'Festival'
  }
]

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-beige">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-beige py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <MdEventAvailable className="w-16 h-16 mb-6" />
            <h1 className="text-4xl md:text-6xl font-playfair font-bold text-center mb-6">
              Literary Events
            </h1>
            <p className="text-xl text-center max-w-2xl mx-auto font-arabic">
              Join us for inspiring literary gatherings and cultural celebrations
            </p>
          </div>
        </div>
      </section>

      {/* Events Filter */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-2 bg-secondary text-accent rounded-lg hover:bg-sand transition duration-300 flex items-center">
              <MdEventAvailable className="w-5 h-5 mr-2" />
              All Events
            </button>
            <button className="px-6 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300 flex items-center">
              <FaRegBookmark className="w-5 h-5 mr-2" />
              Book Launches
            </button>
            <button className="px-6 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300 flex items-center">
              <FaChalkboardTeacher className="w-5 h-5 mr-2" />
              Workshops
            </button>
            <button className="px-6 py-2 bg-beige text-primary rounded-lg hover:bg-sand hover:text-accent transition duration-300 flex items-center">
              <FaUsers className="w-5 h-5 mr-2" />
              Festivals
            </button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-secondary hover:border-primary transition duration-300">
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-secondary text-accent px-3 py-1 rounded-full">
                    {event.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-playfair font-bold text-primary mb-4">
                    {event.title}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-accent">
                      <FaCalendar className="w-4 h-4 mr-2" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-accent">
                      <FaClock className="w-4 h-4 mr-2" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center text-accent">
                      <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-accent mb-6">{event.description}</p>
                  <button className="w-full bg-secondary text-accent py-2 rounded-lg hover:bg-sand transition duration-300">
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-b from-white to-beige">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-playfair font-bold text-primary mb-6">
            Stay Updated
          </h2>
          <p className="text-accent mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive updates about upcoming events and literary gatherings.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none"
            />
            <button className="bg-secondary text-accent px-6 py-2 rounded-lg hover:bg-sand transition duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}