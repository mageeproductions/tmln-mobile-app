import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Bell, CreditCard, Shield, Crown, Check, X, ChevronLeft } from 'lucide-react';
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
  const { user } = useAuth();
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

  if (loading) {
    return (
      <DashboardLayout hideTabBar>
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout hideTabBar>
      <div className="min-h-screen bg-[#0A0A0A]">
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
          <div className="safe-area-top" />
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center -ml-2 active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
          </div>
        </header>

        <div className="px-4 py-6 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Bell className="w-5 h-5 text-white/50" />
              <h2 className="font-semibold text-white">Notifications</h2>
            </div>
            <div className="divide-y divide-white/5">
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <h3 className="text-white font-medium">Push Notifications</h3>
                  <p className="text-white/50 text-sm">Receive alerts on your device</p>
                </div>
                <button
                  onClick={() => handleToggle('push')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.push ? 'bg-green-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-white/50 text-sm">Get updates via email</p>
                </div>
                <button
                  onClick={() => handleToggle('email')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.email ? 'bg-green-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <h3 className="text-white font-medium">Event Reminders</h3>
                  <p className="text-white/50 text-sm">Get reminded about events</p>
                </div>
                <button
                  onClick={() => handleToggle('event_reminders')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.event_reminders ? 'bg-green-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      preferences.event_reminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <h3 className="text-white font-medium">Messages</h3>
                  <p className="text-white/50 text-sm">New message alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('message_notifications')}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    preferences.message_notifications ? 'bg-green-500' : 'bg-white/10'
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

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <CreditCard className="w-5 h-5 text-white/50" />
              <h2 className="font-semibold text-white">Subscription</h2>
            </div>
            <div className="p-4">
              {isPro ? (
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">TMLN Pro</h3>
                  </div>
                  <p className="text-white/70 mb-4">You have access to all Pro features</p>

                  {currentPriceData && (
                    <div className="text-2xl font-bold text-white mb-4">
                      ${currentPriceData.price.price_per_unit}
                      <span className="text-sm font-normal text-white/50">
                        /{currentPriceData.price.interval === 'month' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {['Unlimited Events', 'Unlimited Vendors', 'Advanced Timeline', 'Priority Support'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {subscription?.current_period_end && (
                    <p className="text-white/50 text-sm mt-4">
                      {subscription.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">Free Plan</h3>
                    <p className="text-white/50 text-sm mb-4">Current plan</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-white/40" />
                        <span className="text-white/60 text-sm">Up to 5 events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-white/40" />
                        <span className="text-white/60 text-sm">10 vendors per event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-white/20" />
                        <span className="text-white/30 text-sm">Advanced features</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white">Upgrade to Pro</h3>
                    </div>
                    <p className="text-white/60 text-sm mb-4">Unlock unlimited events and features</p>

                    {proProduct && (
                      <>
                        <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/10">
                          <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                              billingCycle === 'monthly' ? 'bg-white text-black' : 'text-white/60'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setBillingCycle('annual')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                              billingCycle === 'annual' ? 'bg-white text-black' : 'text-white/60'
                            }`}
                          >
                            Annual (-17%)
                          </button>
                        </div>

                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold text-white">
                            ${billingCycle === 'monthly'
                              ? proProduct.prices.find(p => p.interval === 'month')?.price_per_unit
                              : proProduct.prices.find(p => p.interval === 'year')?.price_per_unit}
                          </span>
                          <span className="text-white/50">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>

                        <button
                          onClick={handleUpgradeToPro}
                          disabled={upgrading}
                          className="w-full py-3.5 bg-white text-black rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
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

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Shield className="w-5 h-5 text-white/50" />
              <h2 className="font-semibold text-white">Account</h2>
            </div>
            <div className="divide-y divide-white/5">
              <div className="px-4 py-4">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/5 transition-colors">
                <span className="text-white/60">Change Password</span>
                <span className="text-white/30 text-sm">Coming soon</span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/5 transition-colors">
                <span className="text-white/60">Two-Factor Auth</span>
                <span className="text-white/30 text-sm">Coming soon</span>
              </button>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs pb-4">
            TMLN Mobile v1.0.0
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
