import { useState } from 'react';
import { Check, Sparkles, Crown, X, ArrowRight } from 'lucide-react';
import { stripeProducts } from '../stripe-config';

interface PaywallProps {
  eventsPerYear: string;
  onContinue: () => void;
  onSelectPlan?: (plan: 'free' | 'pro', billingCycle?: 'monthly' | 'annual') => void;
}

const isHighVolume = (events: string): boolean => {
  return ['6-10', '11-20', '20+'].includes(events);
};

export default function Paywall({ eventsPerYear, onContinue, onSelectPlan }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const product = stripeProducts[0];
  const monthlyPrice = product.prices.find(p => p.interval === 'month');
  const annualPrice = product.prices.find(p => p.interval === 'year');

  const selectedPrice = billingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const monthlySavings = monthlyPrice && annualPrice
    ? ((monthlyPrice.price_per_unit * 12 - annualPrice.price_per_unit) / (monthlyPrice.price_per_unit * 12) * 100).toFixed(0)
    : 0;
  const highVolume = isHighVolume(eventsPerYear);

  const handleContinue = () => {
    if (onSelectPlan && selectedPlan) {
      onSelectPlan(selectedPlan, selectedPlan === 'pro' ? billingCycle : undefined);
    }
    onContinue();
  };

  if (highVolume) {
    return (
      <div className="w-full max-w-2xl">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
          <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(139,92,246,0.4)] overflow-hidden border border-purple-400/40 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">You're a power user!</h2>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                Managing {eventsPerYear} events per year? TMLN Pro was built for professionals like you.
              </p>
            </div>

            {selectedPlan === 'pro' && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-gray-700 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all relative ${
                      billingCycle === 'annual'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Annual
                    {monthlySavings > 0 && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                        Save {monthlySavings}%
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div
                onClick={() => setSelectedPlan('free')}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'free'
                    ? 'border-gray-400 bg-gray-700/50'
                    : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
                <p className="text-3xl font-bold text-white mb-4">$0<span className="text-lg text-gray-400">/mo</span></p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    Up to 5 active events
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    Basic timeline features
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    Team messaging
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <X className="w-4 h-4 text-gray-500" />
                    Limited vendor slots
                  </li>
                </ul>
                {selectedPlan === 'free' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-900" />
                  </div>
                )}
              </div>

              <div
                onClick={() => setSelectedPlan('pro')}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'pro'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-purple-500/50 bg-gray-800/50 hover:border-purple-400'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold text-white">
                  RECOMMENDED
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  Pro
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </h3>
                <div className="mb-4">
                  {billingCycle === 'monthly' ? (
                    <p className="text-3xl font-bold text-white">
                      ${monthlyPrice?.price_per_unit}
                      <span className="text-lg text-gray-400">/mo</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-white">
                        ${annualPrice?.price_per_unit}
                        <span className="text-lg text-gray-400">/yr</span>
                      </p>
                      <p className="text-sm text-purple-400">
                        ${(annualPrice!.price_per_unit / 12).toFixed(2)}/mo billed annually
                      </p>
                    </>
                  )}
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    Unlimited events
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    Advanced timeline tools
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    Unlimited vendors
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-purple-400" />
                    Analytics dashboard
                  </li>
                </ul>
                {selectedPlan === 'pro' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedPlan}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                selectedPlan
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedPlan === 'pro' ? 'Start Pro Trial' : 'Continue with Free'}
              <ArrowRight className="w-5 h-5" />
            </button>

            {selectedPlan === 'pro' && (
              <p className="text-center text-gray-400 text-sm mt-3">
                14-day free trial, cancel anytime
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
        <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(139,92,246,0.4)] overflow-hidden border border-purple-400/40 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">You're all set!</h2>
            <p className="text-gray-300 text-lg">
              Welcome to TMLN. You're starting on our free plan, which is perfect for managing up to 5 events.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              What's included in Free:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Up to 5 active events
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Full timeline management
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Team messaging & collaboration
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Vendor coordination tools
              </li>
            </ul>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Need more? Upgrade to Pro anytime from Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
