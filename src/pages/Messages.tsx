import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { MessageSquare, Users, ChevronRight } from 'lucide-react';
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_messages' }, () => fetchEventChats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_read_receipts' }, () => fetchEventChats())
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user]);

  const fetchEventChats = async () => {
    if (!user) return;

    setLoading(true);

    const { data: memberEvents } = await supabase
      .from('event_members')
      .select('event_id, events(id, event_name, event_date)')
      .eq('user_id', user.id);

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
    <DashboardLayout title="Messages">
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="safe-area-top" />

        <div className="px-4 pt-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : eventChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-white/50 text-center">Join an event to start chatting with your team</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventChats.map((chat) => (
                <button
                  key={chat.event_id}
                  onClick={() => navigate(`/dashboard/messages/${chat.event_id}`)}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-left active:scale-[0.98] transition-transform"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    {chat.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1">
                        <span className="text-white text-xs font-bold">
                          {chat.unread_count > 9 ? '9+' : chat.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`truncate pr-2 ${chat.unread_count > 0 ? 'font-bold text-white' : 'font-semibold text-white'}`}>
                        {chat.event_name}
                      </h3>
                      {chat.last_message_time && (
                        <span className={`text-xs flex-shrink-0 ${chat.unread_count > 0 ? 'text-white' : 'text-white/40'}`}>
                          {formatDate(chat.last_message_time)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${chat.unread_count > 0 ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                      {chat.last_message || 'No messages yet'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
