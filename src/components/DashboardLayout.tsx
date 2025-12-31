import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, MessageSquare, Mail, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  rightAction?: ReactNode;
  hideTabBar?: boolean;
}

interface Profile {
  first_name: string;
  last_name: string;
  occupation: string;
  profile_photo_url: string;
}

export default function DashboardLayout({
  children,
  title,
  rightAction,
  hideTabBar = false
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPendingInvitesCount();
      fetchUnreadMessagesCount();
    }

    const invitationsChannel = supabase
      .channel('invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_vendor_invitations',
        },
        () => {
          fetchPendingInvitesCount();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_messages',
        },
        () => {
          fetchUnreadMessagesCount();
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
          fetchUnreadMessagesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, occupation, profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const fetchPendingInvitesCount = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from('event_vendor_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', user.id)
      .eq('status', 'pending');

    if (!error && count !== null) {
      setPendingInvitesCount(count);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    if (!user) return;

    const { data: memberEvents } = await supabase
      .from('event_members')
      .select('event_id')
      .eq('user_id', user.id);

    if (!memberEvents || memberEvents.length === 0) {
      setUnreadMessagesCount(0);
      return;
    }

    const eventIds = memberEvents.map(m => m.event_id);

    const { data: allMessages } = await supabase
      .from('event_messages')
      .select('id, user_id')
      .in('event_id', eventIds)
      .neq('user_id', user.id);

    if (!allMessages || allMessages.length === 0) {
      setUnreadMessagesCount(0);
      return;
    }

    let unreadCount = 0;

    for (const msg of allMessages) {
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

    setUnreadMessagesCount(unreadCount);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  const tabItems = [
    { icon: Home, label: 'Events', path: '/dashboard' },
    { icon: Users, label: 'Contacts', path: '/dashboard/contacts' },
    { icon: Mail, label: 'Invites', path: '/dashboard/invites', badge: pendingInvitesCount },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages', badge: unreadMessagesCount },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  const isTabActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/events');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {title && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
          <div className="safe-area-top" />
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  onClick={() => navigate('/dashboard/profile')}
                />
              ) : (
                <div
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate('/dashboard/profile')}
                >
                  <span className="text-white font-semibold text-xs">{getInitials()}</span>
                </div>
              )}
              <h1 className="text-lg font-semibold text-white">{title}</h1>
            </div>
            {rightAction && (
              <div className="flex items-center">
                {rightAction}
              </div>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 ${title ? 'pt-14' : ''} ${!hideTabBar ? 'pb-20' : ''}`}>
        <div className={title ? 'safe-area-top' : ''} />
        {children}
        {!hideTabBar && <div className="h-safe" />}
      </main>

      {!hideTabBar && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-stretch justify-around">
            {tabItems.map((item) => {
              const active = isTabActive(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 pt-3 transition-all active:scale-95 ${
                    active ? 'text-white' : 'text-white/40'
                  }`}
                >
                  <div className="relative">
                    <item.icon className={`w-6 h-6 ${active ? 'text-white' : ''}`} strokeWidth={active ? 2.5 : 2} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${active ? 'text-white' : 'text-white/40'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="safe-area-bottom bg-[#0A0A0A]" />
        </nav>
      )}
    </div>
  );
}
