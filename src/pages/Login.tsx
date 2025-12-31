import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingFlow from '../components/OnboardingFlow';
import Paywall from '../components/Paywall';

type ViewMode = 'signin' | 'onboarding' | 'paywall';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('signin');
  const [eventsPerYear, setEventsPerYear] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const transitionTo = (mode: ViewMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(mode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const handleStartSignUp = () => {
    transitionTo('onboarding');
  };

  const handleOnboardingComplete = (events: string) => {
    setEventsPerYear(events);
    transitionTo('paywall');
  };

  const handlePaywallContinue = () => {
    navigate('/dashboard');
  };

  const handleBackToSignIn = () => {
    transitionTo('signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center px-4 py-8">
      <div
        className={`transition-all duration-500 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {viewMode === 'signin' && (
          <div className="w-full" style={{ maxWidth: '1000px' }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(139,92,246,0.4)] p-16 border border-purple-400/40 hover:border-purple-400/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex flex-col items-center mb-8">
                    <img
                      src="/icon.png"
                      alt="TMLN"
                      className="w-16 h-16 rounded-xl mb-4 shadow-xl shadow-purple-500/40"
                    />
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">Welcome Back</h1>
                    <p className="text-gray-200 mt-2">Sign in to manage your events</p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-6">
                    {error && (
                      <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/60 rounded-lg p-3 shadow-lg shadow-red-500/20">
                        <p className="text-red-200 text-sm font-medium">{error}</p>
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/60 rounded-lg p-3 shadow-lg shadow-green-500/20">
                        <p className="text-green-200 text-sm font-medium">{success}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-900/70 backdrop-blur-sm border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-gray-900/90 transition-all shadow-inner"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-900/70 backdrop-blur-sm border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-gray-900/90 transition-all shadow-inner"
                        placeholder="Enter your password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="mt-6 space-y-3">
                    <div className="text-center">
                      <button
                        onClick={handleStartSignUp}
                        className="text-purple-400 hover:text-purple-300 text-sm transition"
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                    <div className="text-center">
                      <a href="/" className="text-gray-300 hover:text-white text-sm transition">
                        Back to home
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'onboarding' && (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onBack={handleBackToSignIn}
          />
        )}

        {viewMode === 'paywall' && (
          <Paywall
            eventsPerYear={eventsPerYear}
            onContinue={handlePaywallContinue}
          />
        )}
      </div>
    </div>
  );
}
