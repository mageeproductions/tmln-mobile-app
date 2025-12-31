import { useState, FormEvent, useEffect, useRef } from 'react';
import { Sparkles, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SuccessModal from './SuccessModal';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [crossedOut, setCrossedOut] = useState([false, false, false]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setCrossedOut([true, false, false]), 200);
            setTimeout(() => setCrossedOut([true, true, false]), 500);
            setTimeout(() => setCrossedOut([true, true, true]), 800);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: email.toLowerCase().trim() }]);

      if (error) {
        if (error.code === '23505') {
          setStatus('error');
          setMessage('This email is already on our waitlist!');
        } else {
          setStatus('error');
          setMessage('Something went wrong. Please try again.');
        }
      } else {
        setStatus('success');
        setShowModal(true);
        setEmail('');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please check your connection.');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto w-full text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-sm font-medium text-purple-300">
          <Sparkles className="w-4 h-4" />
          <span>Launching Early 2026</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.2] pb-4">
          Wedding days are <span className="gradient-text">chaotic.</span> Coordinating vendors doesn't have to be.
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one platform for seamless event vendor coordination. Real-time collaboration,
          timelines, messaging, and vendor management in one beautiful app. Built by wedding vendors - for wedding vendors.
        </p>

        <div className="max-w-xl mx-auto pt-6">
          <div className="glass-effect rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-500"
                  disabled={status === 'loading' || status === 'success'}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 glow-purple hover:glow-purple-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-5 h-5" />}
                {status === 'loading' ? 'Joining Waitlist...' : status === 'success' ? 'You\'re In!' : 'Get Early Access'}
              </button>

              {message && status === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </form>

          </div>
        </div>

        <div className="flex items-center gap-6 justify-center text-sm text-gray-400 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Early bird benefits</span>
          </div>
        </div>

        <div ref={sectionRef} className="pt-16 max-w-6xl mx-auto">
          <div className="glass-effect rounded-3xl p-8 sm:p-12 space-y-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white">
              Say goodbye to...
            </h2>

            <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 lg:gap-16">
                {['Buried Details in Emails', 'Static PDF Timelines'].map((text, index) => (
                  <div key={index} className="relative px-4 max-w-full">
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white text-center md:whitespace-nowrap break-words">
                      {text}
                    </h2>
                    {crossedOut[index] && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="10"
                          y1="10"
                          x2="90"
                          y2="90"
                          stroke="rgba(239, 68, 68, 0.8)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          style={{
                            strokeDasharray: 150,
                            strokeDashoffset: 150,
                            animation: 'drawX 0.3s ease-out forwards',
                            filter: 'url(#brush-filter)'
                          }}
                        />
                        <line
                          x1="90"
                          y1="10"
                          x2="10"
                          y2="90"
                          stroke="rgba(239, 68, 68, 0.8)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          style={{
                            strokeDasharray: 150,
                            strokeDashoffset: 150,
                            animation: 'drawX 0.3s ease-out 0.15s forwards',
                            filter: 'url(#brush-filter)'
                          }}
                        />
                        <defs>
                          <filter id="brush-filter">
                            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                          </filter>
                        </defs>
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center">
                <div className="relative px-4 max-w-full">
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white text-center md:whitespace-nowrap break-words">
                    Wasted Time Communicating Updates
                  </h2>
                  {crossedOut[2] && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1="10"
                        y1="10"
                        x2="90"
                        y2="90"
                        stroke="rgba(239, 68, 68, 0.8)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 150,
                          strokeDashoffset: 150,
                          animation: 'drawX 0.3s ease-out forwards',
                          filter: 'url(#brush-filter)'
                        }}
                      />
                      <line
                        x1="90"
                        y1="10"
                        x2="10"
                        y2="90"
                        stroke="rgba(239, 68, 68, 0.8)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 150,
                          strokeDashoffset: 150,
                          animation: 'drawX 0.3s ease-out 0.15s forwards',
                          filter: 'url(#brush-filter)'
                        }}
                      />
                      <defs>
                        <filter id="brush-filter">
                          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                        </filter>
                      </defs>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setStatus('idle');
        }}
      />
    </section>
  );
}
