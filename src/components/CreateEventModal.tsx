import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  onEventLimitReached?: (eventCount: number) => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess, userId, onEventLimitReached }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    couple_name_1: '',
    couple_name_2: '',
    event_date: '',
    end_date: '',
    multi_day_event: false,
    location: '',
    location_address: '',
    event_type: 'wedding',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    console.log('Subscription check:', { isProUser, eventCount: eventTotal, status: subscriptionData?.subscription_status });
  };

  if (!isOpen) return null;

  const generateInviteCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.couple_name_1 || !formData.event_date) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    console.log('Event creation check:', { isPro, eventCount, willBlock: !isPro && eventCount >= 5 });

    if (!isPro && eventCount >= 5) {
      console.log('BLOCKING: User hit event limit', { eventCount });
      setLoading(false);
      handleClose();
      if (onEventLimitReached) {
        onEventLimitReached(eventCount);
      }
      return;
    }

    let inviteCode = generateInviteCode();
    let attempts = 0;
    let codeIsUnique = false;

    while (!codeIsUnique && attempts < 10) {
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (!existingEvent) {
        codeIsUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    const eventName = formData.couple_name_2
      ? `${formData.couple_name_1} & ${formData.couple_name_2}`
      : formData.couple_name_1;

    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        event_name: eventName,
        event_type: formData.event_type,
        event_date: formData.event_date,
        end_date: formData.multi_day_event && formData.end_date ? formData.end_date : null,
        multi_day_event: formData.multi_day_event,
        location: formData.location,
        location_address: formData.location_address,
        couple_name_1: formData.couple_name_1,
        couple_name_2: formData.couple_name_2,
        created_by: userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      setError('Failed to create event. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      couple_name_1: '',
      couple_name_2: '',
      event_date: '',
      end_date: '',
      multi_day_event: false,
      location: '',
      location_address: '',
      event_type: 'wedding',
    });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="corporate">Corporate Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  First Client Name *
                </label>
                <input
                  type="text"
                  value={formData.couple_name_1}
                  onChange={(e) => setFormData({ ...formData, couple_name_1: e.target.value })}
                  placeholder="Enter name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Second Client Name
                </label>
                <input
                  type="text"
                  value={formData.couple_name_2}
                  onChange={(e) => setFormData({ ...formData, couple_name_2: e.target.value })}
                  placeholder="Enter name (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="multi_day"
                  checked={formData.multi_day_event}
                  onChange={(e) => setFormData({ ...formData, multi_day_event: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="multi_day" className="text-sm font-medium text-gray-700">
                  Multi-day event
                </label>
              </div>

              <div className={formData.multi_day_event ? 'grid grid-cols-2 gap-4' : ''}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formData.multi_day_event ? 'Start Date *' : 'Event Date *'}
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {formData.multi_day_event && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.event_date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Name
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Grand Hotel Ballroom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Address (recommended)
              </label>
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder="Enter full address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
