import { useState, FormEvent } from 'react';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SuccessModal from './SuccessModal';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

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
    <>
      <section id="signup" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent"></div>

        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Get <span className="gradient-text">Early Access</span>
            </h2>
            <p className="text-xl text-gray-400">
              Be the first to experience stress-free event planning
            </p>
          </div>

          <div className="glass-effect rounded-3xl p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-white placeholder-gray-500"
                  disabled={status === 'loading'}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 glow-purple hover:glow-purple-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === 'loading' ? 'Joining Waitlist...' : 'Join the Waitlist'}
              </button>

              {message && status === 'error' && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      <SuccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
