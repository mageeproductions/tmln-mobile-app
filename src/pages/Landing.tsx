import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import PhoneScroll from '../components/PhoneScroll';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#1D1F2E] text-white">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-effect shadow-lg' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="TMLN"
              className="w-10 h-10 rounded-lg"
            />
            <span className="text-2xl font-bold tracking-wide">TMLN</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://forms.gle/rULNqLjebBU4kFXv5"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block px-4 py-2 border border-purple-500/50 hover:border-purple-400 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 hover:bg-purple-500/10"
            >
              Share Your Thoughts
            </a>
            <button
              onClick={scrollToTop}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
            >
              Get Early Access
            </button>
          </div>
        </div>
      </nav>

      <Hero />
      <PhoneScroll />
      <Features />
      <Footer />
    </div>
  );
}
