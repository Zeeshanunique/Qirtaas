import { Metadata } from 'next'
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'Contact - Qirtaas Publications',
  description: 'Get in touch with Qirtaas Publications',
}

const contactInfo = [
  {
    icon: FaEnvelope,
    title: 'Email',
    content: 'info@qirtaas.com',
    link: 'mailto:info@qirtaas.com'
  },
  {
    icon: FaPhone,
    title: 'Phone',
    content: '+1 (234) 567-8900',
    link: 'tel:+12345678900'
  },
  {
    icon: FaMapMarkerAlt,
    title: 'Location',
    content: 'Dubai, United Arab Emirates',
    link: '#'
  }
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-beige">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-beige py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto font-arabic">
            We'd love to hear from you
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-bold text-primary">{item.title}</h3>
                    <p className="text-accent">{item.content}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Contact Form */}
            <form className="md:col-span-2 bg-white p-8 rounded-lg shadow-lg border border-secondary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-accent mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-accent mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-accent mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-accent mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:border-primary focus:outline-none resize-none"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-secondary text-accent py-3 rounded-lg hover:bg-sand transition duration-300"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}