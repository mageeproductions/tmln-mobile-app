import { useState } from 'react';
import { X, Crown, Check, Sparkles } from 'lucide-react';
import { stripeProducts } from '../stripe-config';

interface EventLimitPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  currentEventCount: number;
  onUpgrade: (billingCycle: 'monthly' | 'annual') => void;
}

export default function EventLimitPaywall({
  isOpen,
  onClose,
  currentEventCount,
  onUpgrade
}: EventLimitPaywallProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const product = stripeProducts[0];
  const monthlyPrice = product.prices.find(p => p.interval === 'month');
  const annualPrice = product.prices.find(p => p.interval === 'year');

  const selectedPrice = billingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const monthlySavings = monthlyPrice && annualPrice
    ? ((monthlyPrice.price_per_unit * 12 - annualPrice.price_per_unit) / (monthlyPrice.price_per_unit * 12) * 100).toFixed(0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>

        <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-purple-400/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition z-10"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">You've reached the event limit</h2>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                You currently have {currentEventCount} active events. Free plan users can manage up to 5 events at a time.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50 max-w-md mx-auto">
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

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-xl border-2 border-gray-600/50 bg-gray-800/50">
                <h3 className="text-xl font-semibold text-white mb-2">Free Plan</h3>
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
                  <li className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    Vendor coordination
                  </li>
                </ul>
                <div className="mt-4 px-3 py-2 bg-gray-700/50 rounded-lg text-center">
                  <span className="text-sm text-gray-400">Current Plan</span>
                </div>
              </div>

              <div className="relative p-6 rounded-xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
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
                      {product.currency_symbol}{monthlyPrice?.price_per_unit}
                      <span className="text-lg text-gray-400">/mo</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-white">
                        {product.currency_symbol}{annualPrice?.price_per_unit}
                        <span className="text-lg text-gray-400">/yr</span>
                      </p>
                      <p className="text-sm text-purple-400">
                        {product.currency_symbol}{(annualPrice!.price_per_unit / 12).toFixed(2)}/mo billed annually
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
                <button
                  onClick={() => onUpgrade(billingCycle)}
                  className="mt-4 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
