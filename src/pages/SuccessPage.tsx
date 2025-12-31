import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Crown, Zap, Users, Calendar, Star, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { stripeProducts } from '../stripe-config';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);

  const sessionId = searchParams.get('session_id');
  const recommended = searchParams.get('recommended');

  const proProduct = stripeProducts.find(p => p.name === 'TMLN Pro');

  useEffect(() => {
    if (!recommended) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, recommended]);

  const handleUpgradeToPro = async () => {
    if (!proProduct) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            price_id: proProduct.priceId,
            success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/success?recommended=pro`,
            mode: proProduct.mode,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoading(false);
    }
  };

  if (recommended === 'pro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.4),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="max-w-5xl w-full relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome to TMLN!
            </h1>
            <p className="text-purple-200 text-lg">
              Based on your event volume, we recommend TMLN Pro
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/40 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Free Plan</h2>
                <p className="text-gray-400 text-sm">Great for getting started</p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-1">$0</div>
                <div className="text-gray-400 text-sm">Forever free</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm">Up to 5 events</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm">Up to 10 vendors per event</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm">Basic timeline features</p>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-500 text-sm">Priority support</p>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-500 text-sm">Advanced features</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-purple-400/50 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                RECOMMENDED
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  TMLN Pro
                </h2>
                <p className="text-purple-200 text-sm">Perfect for high-volume professionals</p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-1">
                  ${proProduct?.price_per_unit || 59}
                </div>
                <div className="text-purple-300 text-sm">per month</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Unlimited Events</p>
                    <p className="text-purple-200 text-xs">Manage as many as you need</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Unlimited Vendors</p>
                    <p className="text-purple-200 text-xs">Collaborate with your entire network</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Advanced Timeline Management</p>
                    <p className="text-purple-200 text-xs">Keep every detail organized</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Priority Support</p>
                    <p className="text-purple-200 text-xs">Get help when you need it</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Advanced Analytics</p>
                    <p className="text-purple-200 text-xs">Track your performance</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpgradeToPro}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all font-semibold flex items-center justify-center shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-purple-300 hover:text-white text-sm transition-colors underline"
            >
              Start with Free Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your payment has been processed successfully.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900">TMLN Pro Activated</span>
            </div>
            <p className="text-sm text-purple-700">
              You now have access to all premium features!
            </p>
          </div>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Session ID:</p>
              <p className="text-sm font-mono text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>

            <p className="text-sm text-gray-500">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}