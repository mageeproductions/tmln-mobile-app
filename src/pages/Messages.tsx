import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MessageSquare, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EventChat {
  event_id: string;
  event_name: string;
  event_date: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventChats, setEventChats] = useState<EventChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEventChats();

      const messagesChannel = supabase
        .channel('messages_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_messages',
          },
          () => {
            fetchEventChats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_read_receipts',
          },
          () => {
            fetchEventChats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user]);

  const fetchEventChats = async () => {
    if (!user) return;

    setLoading(true);

    const { data: memberEvents, error: eventsError } = await supabase
      .from('event_members')
      .select('event_id, events(id, event_name, event_date)')
      .eq('user_id', user.id);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      setLoading(false);
      return;
    }

    const chats: EventChat[] = [];

    for (const member of memberEvents || []) {
      if (!member.events) continue;

      const event = Array.isArray(member.events) ? member.events[0] : member.events;

      const { data: lastMessage } = await supabase
        .from('event_messages')
        .select('message, created_at')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: allMessages } = await supabase
        .from('event_messages')
        .select('id, user_id')
        .eq('event_id', event.id);

      let unreadCount = 0;

      if (allMessages && allMessages.length > 0) {
        for (const msg of allMessages) {
          if (msg.user_id === user.id) continue;

          const { data: receipt } = await supabase
            .from('message_read_receipts')
            .select('id')
            .eq('message_id', msg.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!receipt) {
            unreadCount++;
          }
        }
      }

      chats.push({
        event_id: event.id,
        event_name: event.event_name,
        event_date: event.event_date,
        last_message: lastMessage?.message || null,
        last_message_time: lastMessage?.created_at || null,
        unread_count: unreadCount,
      });
    }

    chats.sort((a, b) => {
      if (!a.last_message_time && !b.last_message_time) return 0;
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    setEventChats(chats);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-sm sm:text-base text-gray-600">Communicate with your team and vendors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              Loading chats...
            </div>
          ) : eventChats.length === 0 ? (
            <div className="p-8 sm:p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
                <p className="text-sm sm:text-base text-gray-600">Join an event to start chatting with your team</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {eventChats.map((chat) => (
                <button
                  key={chat.event_id}
                  onClick={() => navigate(`/dashboard/messages/${chat.event_id}`)}
                  className="w-full p-4 sm:p-6 hover:bg-gray-50 transition text-left flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                    <Users className="w-6 h-6 text-purple-600" />
                    {chat.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chat.unread_count > 9 ? '9+' : chat.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm truncate ${chat.unread_count > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                        {chat.event_name}
                      </h3>
                      {chat.last_message_time && (
                        <span className={`text-xs ml-2 flex-shrink-0 ${chat.unread_count > 0 ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
                          {formatDate(chat.last_message_time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate flex-1 ${chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {chat.last_message || 'No messages yet'}
                      </p>
                      {chat.unread_count > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
