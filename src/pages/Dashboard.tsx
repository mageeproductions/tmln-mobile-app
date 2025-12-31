import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Plus, Search, UserPlus, PlusCircle, MapPin, Clock, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateEventModal from '../components/CreateEventModal';
import JoinEventModal from '../components/JoinEventModal';
import EventLimitPaywall from '../components/EventLimitPaywall';

type FilterCategory = 'all' | 'upcoming' | 'this-month' | 'completed';

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  end_date: string | null;
  location: string;
  location_address: string;
  couple_name_1: string;
  couple_name_2: string;
  created_at: string;
  multi_day_event: boolean;
  created_by: string;
  creator_name?: string;
}

interface EventStats {
  total: number;
  upcoming: number;
  thisMonth: number;
  completed: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    upcoming: 0,
    thisMonth: 0,
    completed: 0,
  });
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEventLimitPaywall, setShowEventLimitPaywall] = useState(false);
  const [currentEventCount, setCurrentEventCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);

    const { data: memberEvents, error: memberError } = await supabase
      .from('event_members')
      .select('event_id, events(*)')
      .eq('user_id', user.id);

    if (memberError) {
      setLoading(false);
      return;
    }

    const eventsData = memberEvents?.map(m => {
      const event = Array.isArray(m.events) ? m.events[0] : m.events;
      return event;
    }).filter(Boolean) || [];

    const creatorIds = [...new Set(eventsData.map((e: any) => e.created_by).filter(Boolean))];

    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', creatorIds);

      if (profiles) {
        creatorMap = profiles.reduce((acc, p) => {
          const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
          acc[p.id] = name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }
    }

    const eventsWithCreators = eventsData.map((e: any) => ({
      ...e,
      creator_name: creatorMap[e.created_by] || 'Unknown'
    }));

    setEvents(eventsWithCreators as Event[]);
    calculateStats(eventsWithCreators as Event[]);
    setLoading(false);
  };

  const calculateStats = (events: Event[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(e => new Date(e.event_date) >= today).length;

    const thisMonth = events.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate.getMonth() === today.getMonth() &&
             eventDate.getFullYear() === today.getFullYear();
    }).length;

    const completed = events.filter(e => new Date(e.event_date) < today).length;

    setStats({
      total: events.length,
      upcoming,
      thisMonth,
      completed,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEventStatus = (dateString: string) => {
    const days = getDaysUntil(dateString);
    if (days < 0) return { label: 'Completed', color: 'bg-gray-500' };
    if (days === 0) return { label: 'Today', color: 'bg-green-500' };
    if (days === 1) return { label: 'Tomorrow', color: 'bg-blue-500' };
    if (days <= 7) return { label: `${days} days`, color: 'bg-blue-500' };
    if (days <= 30) return { label: `${days} days`, color: 'bg-amber-500' };
    return { label: `${days} days`, color: 'bg-gray-400' };
  };

  const filteredEvents = events
    .filter(event => {
      const matchesSearch =
        event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.couple_name_1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.couple_name_2?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.event_date);

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'upcoming') return eventDate >= today;
      if (selectedFilter === 'completed') return eventDate < today;
      if (selectedFilter === 'this-month') {
        return eventDate.getMonth() === today.getMonth() &&
               eventDate.getFullYear() === today.getFullYear();
      }

      return true;
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const handleEventLimitReached = (eventCount: number) => {
    setCurrentEventCount(eventCount);
    setShowEventLimitPaywall(true);
  };

  const handleUpgrade = async (billingCycle: 'monthly' | 'annual') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const priceId = billingCycle === 'monthly'
        ? 'price_1SjYc6FBXMid40qf3Xfwzrbw'
        : 'price_1SjYc6FBXMid40qf7zrGUIwz';

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: 'subscription',
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/dashboard`,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { key: 'this-month', label: 'This Month', count: stats.thisMonth },
    { key: 'completed', label: 'Past', count: stats.completed },
  ];

  return (
    <DashboardLayout
      title="Events"
      rightAction={
        <button
          onClick={() => setShowActionSheet(true)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 text-black" />
        </button>
      }
    >
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="safe-area-top" />

        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as FilterCategory)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                  selectedFilter === filter.key
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                {filter.label}
                <span className={`ml-1.5 ${selectedFilter === filter.key ? 'text-black/50' : 'text-white/30'}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No events yet</h3>
              <p className="text-white/50 text-center mb-6">Create your first event or join one with a code</p>
              <button
                onClick={() => setShowActionSheet(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const status = getEventStatus(event.event_date);
                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate pr-4">
                          {event.event_name}
                        </h3>
                        <p className="text-white/50 text-sm capitalize">{event.event_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${status.color} text-white text-xs font-medium px-2.5 py-1 rounded-full`}>
                          {status.label}
                        </span>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(event.event_date)}, {formatTime(event.event_date)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showActionSheet && (
        <div className="fixed inset-0 z-50" onClick={() => setShowActionSheet(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 animate-slide-up">
            <div
              className="bg-[#1A1A1A] rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3" />
              <div className="p-6 pt-4">
                <h2 className="text-xl font-semibold text-white mb-1">Add Event</h2>
                <p className="text-white/50 text-sm mb-6">Create a new event or join an existing one</p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowActionSheet(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <PlusCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-white">Create New Event</p>
                      <p className="text-white/50 text-sm">Start planning a new event</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>

                  <button
                    onClick={() => {
                      setShowActionSheet(false);
                      setShowJoinModal(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-white">Join with Code</p>
                      <p className="text-white/50 text-sm">Enter a 6-digit invite code</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                </div>

                <button
                  onClick={() => setShowActionSheet(false)}
                  className="w-full py-4 mt-4 text-white/50 font-medium active:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="safe-area-bottom bg-[#1A1A1A]" />
            </div>
          </div>
        </div>
      )}

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEvents}
        userId={user?.id || ''}
        onEventLimitReached={handleEventLimitReached}
      />

      <JoinEventModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={fetchEvents}
        userId={user?.id || ''}
        onEventLimitReached={handleEventLimitReached}
      />

      <EventLimitPaywall
        isOpen={showEventLimitPaywall}
        onClose={() => setShowEventLimitPaywall(false)}
        currentEventCount={currentEventCount}
        onUpgrade={handleUpgrade}
      />
    </DashboardLayout>
  );
}
