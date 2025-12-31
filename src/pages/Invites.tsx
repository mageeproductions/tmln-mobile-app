import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Mail, Check, X, Calendar, MapPin } from 'lucide-react';

interface Invitation {
  id: string;
  event_id: string;
  vendor_type: string;
  notes: string | null;
  status: string;
  created_at: string;
  events: {
    event_name: string;
    event_date: string;
    location: string | null;
  };
  inviter: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function Invites() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('event_vendor_invitations')
      .select(`
        id, event_id, vendor_type, notes, status, created_at,
        events (event_name, event_date, location),
        inviter:profiles!event_vendor_invitations_invited_by_fkey (first_name, last_name, email)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    setInvitations(data as unknown as Invitation[]);
    setLoading(false);
  };

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
    setProcessingId(invitationId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    await supabase
      .from('event_vendor_invitations')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (status === 'accepted') {
      await supabase.from('event_vendors').insert({
        event_id: invitation.event_id,
        user_id: user.id,
        vendor_type: invitation.vendor_type,
        notes: invitation.notes,
        invitation_status: 'accepted',
        invited_by: user.id,
      });

      await supabase.from('event_members').insert({
        event_id: invitation.event_id,
        user_id: user.id,
        role: 'vendor',
        added_by: user.id,
      });
    }

    setProcessingId(null);
    fetchInvitations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const respondedInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <DashboardLayout title="Invites">
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="safe-area-top" />

        <div className="px-4 pt-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No invitations</h3>
              <p className="text-white/50 text-center">When someone invites you to an event, it will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingInvitations.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-white/50 mb-3 px-1">
                    Pending ({pendingInvitations.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">
                              {invitation.events.event_name}
                            </h3>
                            <p className="text-white/50 text-sm">
                              From {invitation.inviter.first_name} {invitation.inviter.last_name}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-white/60">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDate(invitation.events.event_date)}</span>
                          </div>
                          {invitation.events.location && (
                            <div className="flex items-center gap-2 text-white/60">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm truncate">{invitation.events.location}</span>
                            </div>
                          )}
                          <span className="inline-block px-3 py-1 bg-white/10 text-white/80 rounded-full text-xs font-medium capitalize">
                            {invitation.vendor_type}
                          </span>
                        </div>

                        {invitation.notes && (
                          <p className="text-white/60 text-sm italic mb-4">"{invitation.notes}"</p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                            disabled={processingId === invitation.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                          >
                            <Check className="w-5 h-5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                            disabled={processingId === invitation.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {respondedInvitations.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-white/50 mb-3 px-1">
                    Past Responses
                  </h2>
                  <div className="space-y-2">
                    {respondedInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl opacity-60">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          invitation.status === 'accepted' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {invitation.status === 'accepted' ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{invitation.events.event_name}</p>
                          <p className="text-white/50 text-sm capitalize">{invitation.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
