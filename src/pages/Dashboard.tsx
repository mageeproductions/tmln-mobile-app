import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Plus, Search, UserPlus, PlusCircle, MoreVertical, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateEventModal from '../components/CreateEventModal';
import JoinEventModal from '../components/JoinEventModal';
import EventLimitPaywall from '../components/EventLimitPaywall';

type FilterCategory = 'all' | 'upcoming' | 'this-month' | 'completed';
type SortField = 'name' | 'createdBy' | 'type' | 'date' | 'location';
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
  const [openMenuEventId, setOpenMenuEventId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuEventId(null);
    if (openMenuEventId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuEventId]);

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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedEvents = events
    .filter(event => {
      const matchesSearch =
        event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.couple_name_1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.couple_name_2?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.creator_name?.toLowerCase().includes(searchQuery.toLowerCase());

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
    .sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'name':
          compareResult = a.event_name.localeCompare(b.event_name);
          break;
        case 'createdBy':
          compareResult = (a.creator_name || '').localeCompare(b.creator_name || '');
          break;
        case 'type':
          compareResult = a.event_type.localeCompare(b.event_type);
          break;
        case 'date':
          compareResult = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          break;
        case 'location':
          compareResult = (a.location || '').localeCompare(b.location || '');
          break;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

  const handleRemoveEvent = async (eventId: string, eventName: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Remove "${eventName}" from your dashboard?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      alert('Failed to remove event.');
      return;
    }

    setOpenMenuEventId(null);
    fetchEvents();
  };

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

  const handleEventClick = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}`);
  };

  const filterOptions = [
    { key: 'all', label: 'All Events', count: stats.total },
    { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { key: 'this-month', label: 'This Month', count: stats.thisMonth },
    { key: 'completed', label: 'Past', count: stats.completed },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-purple-600" />
      : <ChevronDown className="w-4 h-4 text-purple-600" />;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Events</h1>
                <p className="text-gray-500 mt-1">Manage your upcoming events and timelines</p>
              </div>
              <button
                onClick={() => setShowActionSheet(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                New Event
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as FilterCategory)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedFilter === filter.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-2 ${selectedFilter === filter.key ? 'text-white/70' : 'text-gray-400'}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">Create your first event to get started</p>
              <button
                onClick={() => setShowActionSheet(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-4">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                          Project Name
                          <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-4">
                        <button
                          onClick={() => handleSort('createdBy')}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                          Created By
                          <SortIcon field="createdBy" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-4">
                        <button
                          onClick={() => handleSort('type')}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                          Type
                          <SortIcon field="type" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-4">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                          Date
                          <SortIcon field="date" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-4">
                        <button
                          onClick={() => handleSort('location')}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                          Location
                          <SortIcon field="location" />
                        </button>
                      </th>
                      <th className="px-6 py-4"></th>
                      <th className="w-12 px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAndSortedEvents.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium hover:text-purple-600 transition-colors">
                            {event.event_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {event.creator_name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 capitalize">
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 whitespace-nowrap">
                            {formatDate(event.event_date)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 max-w-xs truncate block">
                            {event.location || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/events/${event.id}/timeline`);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
                          >
                            View Timeline
                          </button>
                        </td>
                        <td className="px-6 py-4 relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuEventId(openMenuEventId === event.id ? null : event.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openMenuEventId === event.id && (
                            <div
                              className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveEvent(event.id, event.event_name);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center gap-3 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Remove</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showActionSheet && (
        <div className="fixed inset-0 z-50" onClick={() => setShowActionSheet(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Add Event</h2>
                <p className="text-gray-500 text-sm mt-1">Create a new event or join an existing one</p>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <PlusCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Create New Event</p>
                    <p className="text-gray-500 text-sm">Start planning a new event</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setShowJoinModal(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Join with Code</p>
                    <p className="text-gray-500 text-sm">Enter a 6-digit invite code</p>
                  </div>
                </button>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowActionSheet(false)}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
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
