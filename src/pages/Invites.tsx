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

    const { data, error } = await supabase
      .from('event_vendor_invitations')
      .select(`
        id,
        event_id,
        vendor_type,
        notes,
        status,
        created_at,
        events (
          event_name,
          event_date,
          location
        ),
        inviter:profiles!event_vendor_invitations_invited_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      setLoading(false);
      return;
    }

    setInvitations(data as unknown as Invitation[]);
    setLoading(false);
  };

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
    setProcessingId(invitationId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    const { error: updateError } = await supabase
      .from('event_vendor_invitations')
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      setProcessingId(null);
      return;
    }

    if (status === 'accepted') {
      const { error: vendorError } = await supabase
        .from('event_vendors')
        .insert({
          event_id: invitation.event_id,
          user_id: user.id,
          vendor_type: invitation.vendor_type,
          notes: invitation.notes,
          invitation_status: 'accepted',
          invited_by: user.id,
        });

      if (vendorError) {
        console.error('Error adding vendor:', vendorError);
      }

      const { error: memberError } = await supabase
        .from('event_members')
        .insert({
          event_id: invitation.event_id,
          user_id: user.id,
          role: 'vendor',
          added_by: user.id,
        });

      if (memberError && memberError.code !== '23505') {
        console.error('Error adding event member:', memberError);
      }
    }

    setProcessingId(null);
    fetchInvitations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const respondedInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invitations</h1>
          <p className="text-gray-600">Manage your event invitations</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Loading invitations...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingInvitations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Invitations ({pendingInvitations.length})
                </h2>
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {invitation.events.event_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Invited by {invitation.inviter.first_name} {invitation.inviter.last_name}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(invitation.events.event_date)}</span>
                              </div>
                              {invitation.events.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span>{invitation.events.location}</span>
                                </div>
                              )}
                              <div className="mt-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                  {invitation.vendor_type}
                                </span>
                              </div>
                              {invitation.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  "{invitation.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                            disabled={processingId === invitation.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                            disabled={processingId === invitation.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {respondedInvitations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Past Responses
                </h2>
                <div className="space-y-4">
                  {respondedInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          invitation.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {invitation.status === 'accepted' ? (
                            <Check className={`w-6 h-6 text-green-600`} />
                          ) : (
                            <X className={`w-6 h-6 text-red-600`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {invitation.events.event_name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              invitation.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            } capitalize`}>
                              {invitation.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Invited by {invitation.inviter.first_name} {invitation.inviter.last_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(invitation.events.event_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No invitations for now</p>
                <p className="text-gray-400 text-sm mt-2">
                  When someone invites you to their event, it will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
