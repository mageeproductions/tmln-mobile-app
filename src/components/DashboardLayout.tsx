import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, MessageSquare, Settings, Mail, User, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface Profile {
  first_name: string;
  last_name: string;
  occupation: string;
  profile_photo_url: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const navItems = [
    { icon: Home, label: 'Events', path: '/dashboard' },
    { icon: Users, label: 'Contacts', path: '/dashboard/contacts' },
    { icon: Mail, label: 'Invites', path: '/dashboard/invites', badge: pendingInvitesCount },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages', badge: unreadMessagesCount },
  ];

  const bottomNavItems = [
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const isNavActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/events');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0f0f0f] flex flex-col transition-all duration-300 fixed h-screen z-20`}>
        <div className={`border-b border-white/10 ${sidebarCollapsed ? 'p-4' : 'p-6'}`}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src="/icon.png"
                alt="TMLN"
                className="w-10 h-10 flex-shrink-0"
              />
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="TMLN"
                className="w-10 h-10 flex-shrink-0"
              />
              <span className="text-white font-bold text-xl tracking-tight">TMLN</span>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="ml-auto text-gray-400 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${active ? 'text-purple-400' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <ChevronRight className="w-4 h-4 ml-auto text-purple-400" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 space-y-1 border-t border-white/10">
          {bottomNavItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-purple-400' : ''}`} />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate('/dashboard/profile')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl hover:bg-white/5 transition-all`}
          >
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">{getInitials()}</span>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="text-left min-w-0">
                <p className="text-white font-medium truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-gray-500 text-sm truncate">{profile?.occupation || 'Event Professional'}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}
