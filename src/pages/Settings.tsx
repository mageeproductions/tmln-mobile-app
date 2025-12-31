import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Bell, CreditCard, Shield, Crown, Check, X, LogOut } from 'lucide-react';
import { stripeProducts, getProductByPriceId } from '../stripe-config';

interface NotificationPreferences {
  push: boolean;
  email: boolean;
  event_reminders: boolean;
  message_notifications: boolean;
}

interface SubscriptionData {
  subscription_status: string | null;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: true,
    email: true,
    event_reminders: true,
    message_notifications: true,
  });

  const proProduct = stripeProducts.find(p => p.name === 'TMLN Pro');
  const isPro = subscription?.subscription_status === 'active' && subscription?.price_id &&
    proProduct?.prices.some(p => p.id === subscription.price_id);

  const currentPriceData = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('stripe_user_subscriptions')
      .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
      .maybeSingle();

    setSubscription(data);
  };

  const fetchPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.notification_preferences) {
      setPreferences(data.notification_preferences);
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    await supabase
      .from('profiles')
      .update({
        notification_preferences: newPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  };

  const handleUpgradeToPro = async () => {
    if (!proProduct) return;

    const selectedPrice = proProduct.prices.find(p =>
      p.interval === (billingCycle === 'monthly' ? 'month' : 'year')
    );

    if (!selectedPrice) return;

    setUpgrading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            price_id: selectedPrice.id,
            success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/dashboard/settings`,
            mode: proProduct.mode,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setUpgrading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account preferences</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <Bell className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h3 className="text-gray-900 font-medium">Push Notifications</h3>
                  <p className="text-gray-500 text-sm">Receive alerts on your device</p>
                </div>
                <button
                  onClick={() => handleToggle('push')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.push ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h3 className="text-gray-900 font-medium">Email Notifications</h3>
                  <p className="text-gray-500 text-sm">Get updates via email</p>
                </div>
                <button
                  onClick={() => handleToggle('email')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.email ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h3 className="text-gray-900 font-medium">Event Reminders</h3>
                  <p className="text-gray-500 text-sm">Get reminded about events</p>
                </div>
                <button
                  onClick={() => handleToggle('event_reminders')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.event_reminders ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.event_reminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h3 className="text-gray-900 font-medium">Messages</h3>
                  <p className="text-gray-500 text-sm">New message alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('message_notifications')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.message_notifications ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.message_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Subscription</h2>
            </div>
            <div className="p-6">
              {isPro ? (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-xl font-bold text-gray-900">TMLN Pro</h3>
                  </div>
                  <p className="text-gray-600 mb-4">You have access to all Pro features</p>

                  {currentPriceData && (
                    <div className="text-2xl font-bold text-gray-900 mb-4">
                      ${currentPriceData.price.price_per_unit}
                      <span className="text-sm font-normal text-gray-500">
                        /{currentPriceData.price.interval === 'month' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {['Unlimited Events', 'Unlimited Vendors', 'Advanced Timeline', 'Priority Support'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {subscription?.current_period_end && (
                    <p className="text-gray-500 text-sm mt-4">
                      {subscription.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Free Plan</h3>
                    <p className="text-gray-500 text-sm mb-4">Current plan</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">Up to 5 events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">10 vendors per event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-gray-300" />
                        <span className="text-gray-400 text-sm">Advanced features</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-gray-900">Upgrade to Pro</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Unlock unlimited events and features</p>

                    {proProduct && (
                      <>
                        <div className="flex rounded-xl bg-white p-1 mb-4 border border-gray-200">
                          <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                              billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-600'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setBillingCycle('annual')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                              billingCycle === 'annual' ? 'bg-gray-900 text-white' : 'text-gray-600'
                            }`}
                          >
                            Annual (-17%)
                          </button>
                        </div>

                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            ${billingCycle === 'monthly'
                              ? proProduct.prices.find(p => p.interval === 'month')?.price_per_unit
                              : proProduct.prices.find(p => p.interval === 'year')?.price_per_unit}
                          </span>
                          <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>

                        <button
                          onClick={handleUpgradeToPro}
                          disabled={upgrading}
                          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
                        >
                          {upgrading ? 'Processing...' : 'Upgrade Now'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <Shield className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Account</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="text-gray-500">Change Password</span>
                <span className="text-gray-400 text-sm">Coming soon</span>
              </button>
              <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="text-gray-500">Two-Factor Auth</span>
                <span className="text-gray-400 text-sm">Coming soon</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs">
            TMLN v1.0.0
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
