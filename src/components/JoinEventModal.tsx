import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JoinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  onEventLimitReached?: (eventCount: number) => void;
}

export default function JoinEventModal({ isOpen, onClose, onSuccess, userId, onEventLimitReached }: JoinEventModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventFound, setEventFound] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      checkSubscriptionAndEventCount();
    }
  }, [isOpen, userId]);

  const checkSubscriptionAndEventCount = async () => {
    const { data: subscriptionData, error: subError } = await supabase
      .from('stripe_user_subscriptions')
      .select('subscription_status')
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    const isProUser = subscriptionData?.subscription_status === 'active' || subscriptionData?.subscription_status === 'trialing';
    setIsPro(isProUser);

    const { data: events, count, error: eventsError } = await supabase
      .from('event_members')
      .select('event_id', { count: 'exact', head: false })
      .eq('user_id', userId);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    const eventTotal = count !== null ? count : (events?.length || 0);
    setEventCount(eventTotal);

    console.log('Join modal subscription check:', { isProUser, eventCount: eventTotal, status: subscriptionData?.subscription_status });
  };

  if (!isOpen) return null;

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setInviteCode(cleaned);
    setError('');
    setEventFound(null);
  };

  const handleVerifyCode = async () => {
    if (inviteCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        profiles!events_created_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      setError(`Error looking up event: ${eventError.message}`);
      setLoading(false);
      return;
    }

    if (!event) {
      setError('Invalid invite code. Please check and try again.');
      setLoading(false);
      return;
    }

    const { data: existingMember } = await supabase
      .from('event_members')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      setError('You are already a member of this event.');
      setLoading(false);
      return;
    }

    setEventFound(event);
    setLoading(false);
  };

  const handleJoinEvent = async () => {
    if (!eventFound) return;

    console.log('Join event check:', { isPro, eventCount, willBlock: !isPro && eventCount >= 5 });

    if (!isPro && eventCount >= 5) {
      console.log('BLOCKING: User hit event limit on join', { eventCount });
      setLoading(false);
      handleClose();
      if (onEventLimitReached) {
        onEventLimitReached(eventCount);
      }
      return;
    }

    setLoading(true);
    setError('');

    const { error: memberError } = await supabase.from('event_members').insert({
      event_id: eventFound.id,
      user_id: userId,
      role: 'vendor',
      added_by: userId,
    });

    if (memberError) {
      console.error('Error joining event:', memberError);
      if (memberError.code === '23505') {
        setError('You are already a member of this event.');
      } else {
        setError(`Failed to join event: ${memberError.message}`);
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    setEventFound(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Join Event</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!eventFound ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteCode.length === 6 && !loading) {
                      handleVerifyCode();
                    }
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ask the event organizer for the invite code
                </p>
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={inviteCode.length !== 6 || loading}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Event Found!</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You're about to join this event:
                    </p>
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <p className="font-semibold text-gray-900">{eventFound.event_name}</p>
                      {eventFound.profiles && (
                        <p className="text-sm text-gray-600">
                          Created by: {eventFound.profiles.first_name} {eventFound.profiles.last_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(eventFound.event_date)}
                      </p>
                      {eventFound.location && (
                        <p className="text-sm text-gray-600">
                          Location: {eventFound.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEventFound(null);
                    setInviteCode('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinEvent}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Event'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
