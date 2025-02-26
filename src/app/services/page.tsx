import { Metadata } from 'next'
import { FaBook, FaLanguage, FaBullhorn } from 'react-icons/fa'
import { MdRateReview } from 'react-icons/md'

export const metadata: Metadata = {
  title: 'Services - Qirtaas Publications',
  description: 'Professional publishing services offered by Qirtaas Publications',
}

const services = [
  {
    title: 'Manuscript Review',
    description: 'Expert evaluation of your manuscript with detailed feedback and recommendations.',
    Icon: MdRateReview,
    features: ['Editorial Assessment', 'Market Analysis', 'Genre-specific Feedback'],
  },
  {
    title: 'Book Publishing',
    description: 'End-to-end publishing services to bring your book to life.',
    Icon: FaBook,
    features: ['Professional Editing', 'Cover Design', 'Print & Digital Format'],
  },
  {
    title: 'Translation Services',
    description: 'Accurate and culturally sensitive translation services.',
    Icon: FaLanguage,
    features: ['Arabic-English Translation', 'Literary Translation', 'Cultural Adaptation'],
  },
  {
    title: 'Marketing & Distribution',
    description: 'Comprehensive marketing strategies to reach your target audience.',
    Icon: FaBullhorn, // Changed from FaMegaphone to FaBullhorn
    features: ['Online Promotion', 'Bookstore Placement', 'Author Platform Building'],
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-beige">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-beige py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-playfair font-bold text-center mb-6">
            Our Publishing Services
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto font-arabic">
            Professional publishing solutions tailored to bring your literary vision to life
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-8 border border-secondary hover:border-primary transition duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 relative flex-shrink-0 text-primary">
                    <service.Icon className="w-full h-full" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-playfair font-bold text-primary mb-4">
                      {service.title}
                    </h3>
                    <p className="text-accent mb-6">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-accent">
                          <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gradient-to-b from-white to-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-playfair font-bold text-primary text-center mb-12">
            Our Publishing Process
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute top-0 left-1/2 h-full w-px bg-secondary"></div>
              {[
                'Manuscript Submission',
                'Editorial Review',
                'Design & Production',
                'Marketing Strategy',
                'Publication & Distribution'
              ].map((step, index) => (
                <div key={index} className="relative flex items-center mb-8">
                  <div className="w-1/2 pr-8 text-right">
                    <div className="text-primary font-bold">{`Step ${index + 1}`}</div>
                  </div>
                  <div className="absolute left-1/2 w-4 h-4 rounded-full bg-secondary -ml-2"></div>
                  <div className="w-1/2 pl-8">
                    <div className="text-accent">{step}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-playfair font-bold text-beige mb-6">
            Ready to Start Your Publishing Journey?
          </h2>
          <p className="text-beige mb-8 max-w-2xl mx-auto">
            Contact us today to discuss your project and discover how we can help bring your story to readers worldwide.
          </p>
          <button className="bg-secondary text-accent px-8 py-3 rounded-lg hover:bg-sand transition duration-300 font-bold">
            Get Started
          </button>
        </div>
      </section>
    </div>
  )
}