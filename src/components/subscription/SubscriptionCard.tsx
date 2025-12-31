import React, { useState, useEffect } from 'react';
import { Crown, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { stripeProducts, getProductByPriceId } from '../../stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        setError('Failed to load subscription data');
        console.error('Subscription fetch error:', error);
        return;
      }

      setSubscription(data);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const product = stripeProducts[0]; // TMLN Pro
      const selectedPrice = product.prices.find(p =>
        p.interval === (billingCycle === 'monthly' ? 'month' : 'year')
      );

      if (!selectedPrice) {
        setError('Selected pricing option not available');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Please sign in to upgrade');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: selectedPrice.id,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/dashboard`,
        }),
      });

      const { url, error: checkoutError } = await response.json();

      if (checkoutError) {
        setError(checkoutError);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError('Failed to start checkout process');
      console.error('Checkout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={fetchSubscription}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const isActive = subscription?.subscription_status === 'active';
  const productData = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
  const product = stripeProducts[0];
  const monthlyPrice = product.prices.find(p => p.interval === 'month');
  const annualPrice = product.prices.find(p => p.interval === 'year');
  const selectedPrice = billingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const monthlySavings = monthlyPrice && annualPrice
    ? ((monthlyPrice.price_per_unit * 12 - annualPrice.price_per_unit) / (monthlyPrice.price_per_unit * 12) * 100).toFixed(0)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-purple-600" />
          Subscription
        </h3>
        {isActive && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        )}
      </div>

      {isActive && productData ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">{productData.product.name}</h4>
            <p className="text-sm text-gray-600">{productData.product.description}</p>
            <p className="text-lg font-semibold text-purple-600 mt-1">
              {productData.product.currency_symbol}{productData.price.price_per_unit}/{productData.price.interval === 'month' ? 'month' : 'year'}
            </p>
          </div>

          {subscription.current_period_end && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
                {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription.payment_method_brand && subscription.payment_method_last4 && (
            <div className="flex items-center text-sm text-gray-600">
              <CreditCard className="h-4 w-4 mr-2" />
              <span>
                {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
              </span>
            </div>
          )}

          {subscription.cancel_at_period_end && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Your subscription will not renew and will end on{' '}
                {new Date(subscription.current_period_end! * 1000).toLocaleDateString()}.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Free Plan</h4>
            <p className="text-sm text-gray-600">
              You're currently on the free plan. Upgrade to unlock premium features.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h5 className="font-medium text-purple-900 mb-2">TMLN Pro</h5>
            <p className="text-sm text-purple-700 mb-3">
              {product.description}
            </p>

            <div className="mb-3">
              <div className="flex items-center justify-center gap-2 p-0.5 bg-white rounded-lg border border-purple-200">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-purple-100 text-purple-900'
                      : 'text-gray-600 hover:text-purple-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all relative ${
                    billingCycle === 'annual'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:text-purple-900'
                  }`}
                >
                  Annual
                  {monthlySavings > 0 && billingCycle === 'annual' && (
                    <span className="ml-1 text-xs">(-{monthlySavings}%)</span>
                  )}
                </button>
              </div>
            </div>

            {selectedPrice && (
              <div className="mb-3">
                {billingCycle === 'monthly' ? (
                  <p className="text-lg font-semibold text-purple-600">
                    {product.currency_symbol}{selectedPrice.price_per_unit}/month
                  </p>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-purple-600">
                      {product.currency_symbol}{selectedPrice.price_per_unit}/year
                    </p>
                    <p className="text-xs text-purple-700">
                      {product.currency_symbol}{(selectedPrice.price_per_unit / 12).toFixed(2)}/mo billed annually
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}