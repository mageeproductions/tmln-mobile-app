import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Wedding Planner',
    content: 'This app transformed how I coordinate with vendors and clients. The timeline feature alone saved me countless hours.',
    rating: 5,
  },
  {
    name: 'James Chen',
    role: 'Corporate Event Manager',
    content: 'Real-time collaboration is a game-changer. My team stays aligned, and our clients love the transparency.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Celebration Coordinator',
    content: 'Finally, an app that understands event planning. Beautiful interface, powerful features, zero hassle.',
    rating: 5,
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-sm font-medium text-emerald-400 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Trusted by Event Professionals</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold">
            Join <span className="gradient-text">500+</span> Event Planners
          </h2>

          <p className="text-xl text-gray-400">
            Already on the waitlist for early access
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl glass-effect hover:bg-white/10 transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Quote className="w-10 h-10 text-purple-500/30 mb-4" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-emerald-600 flex items-center justify-center font-bold text-white">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
