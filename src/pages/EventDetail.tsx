import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import AddVendorModal from '../components/AddVendorModal';
import ShareInviteModal from '../components/ShareInviteModal';
import VendorDetailModal from '../components/VendorDetailModal';
import VendorSocialMediaModal from '../components/VendorSocialMediaModal';
import { Calendar, MapPin, Users, Save, X, CreditCard as Edit, Clock, ExternalLink, Briefcase, UserPlus, Share2, Image, Plus, Trash2, AtSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  multi_day_event: boolean;
  additional_details: any;
  created_at: string;
  updated_at: string;
  invite_code: string;
}

interface TimelineEvent {
  id: string;
  time: string;
  end_time: string | null;
  title: string;
  description: string;
  location: string;
  color: string;
}

interface Vendor {
  id: string;
  user_id: string | null;
  manual_contact_id: string | null;
  vendor_type: string;
  invitation_status: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  occupation?: string;
  company_name?: string;
  phone?: string;
  bio?: string;
  website?: string;
  instagram_handle?: string;
  facebook_handle?: string;
  tiktok_handle?: string;
  profile_photo_url?: string;
  business_name?: string;
}

interface MediaLink {
  id: string;
  title: string;
  url: string;
  media_type: string;
  created_at: string;
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [mediaLinks, setMediaLinks] = useState<MediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showShareInviteModal, setShowShareInviteModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [showVendorSocialModal, setShowVendorSocialModal] = useState(false);
  const [showAddVendorChoiceModal, setShowAddVendorChoiceModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchTimelineEvents();
      fetchVendors();
      fetchMediaLinks();
    }
  }, [id]);

  const fetchTimelineEvents = async () => {
    const { data, error } = await supabase
      .from('event_timeline')
      .select('id, time, end_time, title, description, location, color')
      .eq('event_id', id)
      .order('time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching timeline events:', error);
    } else if (data) {
      setTimelineEvents(data);
    }
  };

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('event_vendors')
      .select(`
        id,
        user_id,
        manual_contact_id,
        vendor_type,
        invitation_status,
        profiles!event_vendors_user_id_fkey (
          first_name,
          last_name,
          email,
          occupation,
          company_name,
          phone,
          bio,
          website,
          instagram_handle,
          facebook_handle,
          tiktok_handle,
          profile_photo_url
        ),
        manual_contacts!event_vendors_manual_contact_id_fkey (
          name,
          business_name,
          services,
          phone_number,
          email,
          website,
          instagram_handle,
          facebook_handle
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendors:', error);
    } else if (data) {
      const formattedVendors = data.map((vendor: any) => {
        const profile = vendor.profiles;
        const manualContact = vendor.manual_contacts;

        return {
          id: vendor.id,
          user_id: vendor.user_id,
          manual_contact_id: vendor.manual_contact_id,
          vendor_type: vendor.vendor_type,
          invitation_status: vendor.invitation_status,
          first_name: profile?.first_name || (manualContact?.name ? manualContact.name.split(' ')[0] : ''),
          last_name: profile?.last_name || (manualContact?.name ? manualContact.name.split(' ').slice(1).join(' ') : ''),
          email: profile?.email || manualContact?.email || '',
          occupation: profile?.occupation || manualContact?.services || vendor.vendor_type,
          company_name: profile?.company_name || manualContact?.business_name || '',
          phone: profile?.phone || manualContact?.phone_number || '',
          bio: profile?.bio || '',
          website: profile?.website || manualContact?.website || '',
          instagram_handle: profile?.instagram_handle || manualContact?.instagram_handle || '',
          facebook_handle: profile?.facebook_handle || manualContact?.facebook_handle || '',
          tiktok_handle: profile?.tiktok_handle || '',
          business_name: manualContact?.business_name || '',
          profile_photo_url: profile?.profile_photo_url || '',
        };
      });
      setVendors(formattedVendors);
    }
  };

  const fetchMediaLinks = async () => {
    const { data, error } = await supabase
      .from('event_media')
      .select('id, title, url, media_type, created_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media links:', error);
    } else if (data) {
      setMediaLinks(data);
    }
  };

  const handleAddMedia = async () => {
    if (!id || !newMediaTitle.trim() || !newMediaUrl.trim()) return;

    const { error } = await supabase
      .from('event_media')
      .insert({
        event_id: id,
        title: newMediaTitle.trim(),
        url: newMediaUrl.trim(),
        media_type: 'link',
        uploaded_by: user?.id,
      });

    if (error) {
      console.error('Error adding media:', error);
      alert('Failed to add media link');
    } else {
      setNewMediaTitle('');
      setNewMediaUrl('');
      setShowAddMediaModal(false);
      await fetchMediaLinks();
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media link?')) return;

    const { error } = await supabase
      .from('event_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media link');
    } else {
      await fetchMediaLinks();
    }
  };

  const fetchEvent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching event:', error);
    } else if (data) {
      setEvent(data);
      setFormData(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({
        event_name: formData.event_name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        end_date: formData.end_date,
        location: formData.location,
        location_address: formData.location_address,
        couple_name_1: formData.couple_name_1,
        couple_name_2: formData.couple_name_2,
        multi_day_event: formData.multi_day_event,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    } else {
      await fetchEvent();
      setEditing(false);
    }
    setSaving(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">Loading event details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">Event not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-purple-600 hover:text-purple-700 text-sm mb-2 flex items-center gap-1"
            >
              ← Back to Events
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {editing ? 'Edit Event' : event.event_name}
            </h1>
            <p className="text-gray-600 mt-1">
              {editing ? 'Update event details below' : 'View and manage event details'}
            </p>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(event);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Edit className="w-4 h-4" />
                Edit Event
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Event Details
            </h2>
            <div className="space-y-3">
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Event Name</label>
                    <input
                      type="text"
                      value={formData.event_name || ''}
                      onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <input
                        type="text"
                        value={formData.event_type || ''}
                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.event_date || ''}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.multi_day_event || false}
                      onChange={(e) => setFormData({ ...formData, multi_day_event: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="text-sm text-gray-700">Multi-day Event</label>
                  </div>
                  {formData.multi_day_event && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                    <textarea
                      value={formData.location_address || ''}
                      onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{event.event_type}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(event.event_date)}</span>
                  </div>
                  {event.multi_day_event && event.end_date && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">End Date</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(event.end_date)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">Venue</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{event.location || 'Not set'}</span>
                        {event.location && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(event.location_address || event.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Open in Maps"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    {event.location_address && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-500">Address</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[200px]">{event.location_address}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Timeline
              </h2>
              <button
                onClick={() => navigate(`/dashboard/events/${id}/timeline`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Full
              </button>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-2">No timeline events yet</p>
                <button
                  onClick={() => navigate(`/dashboard/events/${id}/timeline`)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Add your first timeline event
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {timelineEvents.map((timelineEvent) => (
                  <div
                    key={timelineEvent.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 transition cursor-pointer"
                    onClick={() => navigate(`/dashboard/events/${id}/timeline`)}
                    style={{ borderLeftWidth: '3px', borderLeftColor: timelineEvent.color }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{timelineEvent.title}</h3>
                        {timelineEvent.location && (
                          <span className="text-xs text-gray-400 truncate hidden sm:inline">
                            {timelineEvent.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {timelineEvent.time}
                      {timelineEvent.end_time && ` - ${timelineEvent.end_time}`}
                    </span>
                  </div>
                ))}
                {timelineEvents.length >= 5 && (
                  <button
                    onClick={() => navigate(`/dashboard/events/${id}/timeline`)}
                    className="w-full text-center text-xs text-purple-600 hover:text-purple-700 font-medium py-1"
                  >
                    View all timeline events
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Vendors
              </h2>
              <div className="flex gap-2">
                {vendors.length > 0 && (
                  <button
                    onClick={() => setShowVendorSocialModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs"
                    title="View all social media handles"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Social</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddVendorChoiceModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {vendors.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-1">No vendors added yet</p>
                <p className="text-xs text-gray-400">Add vendors from contacts or share the invite code</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition cursor-pointer"
                  >
                    {vendor.profile_photo_url ? (
                      <img
                        src={vendor.profile_photo_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium flex-shrink-0 text-xs">
                        {vendor.first_name && vendor.last_name
                          ? `${vendor.first_name[0]}${vendor.last_name[0]}`
                          : vendor.business_name
                          ? vendor.business_name[0]
                          : vendor.vendor_type[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-xs">
                        {vendor.first_name && vendor.last_name
                          ? `${vendor.first_name} ${vendor.last_name}`
                          : vendor.business_name || vendor.vendor_type}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{vendor.occupation}</p>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        vendor.invitation_status === 'accepted'
                          ? 'bg-green-500'
                          : vendor.invitation_status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                      title={vendor.invitation_status}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                Media
              </h2>
              <button
                onClick={() => setShowAddMediaModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {mediaLinks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-1">No media links yet</p>
                <p className="text-xs text-gray-400">Add links to photos or videos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mediaLinks.map((media) => (
                  <a
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-xs">{media.title}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        {(() => {
                          try {
                            return new URL(media.url).hostname;
                          } catch {
                            return media.url;
                          }
                        })()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteMedia(media.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 text-gray-900">{formatDate(event.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 text-gray-900">{formatDate(event.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <AddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        onSuccess={() => {
          fetchVendors();
        }}
        eventId={id!}
        userId={user?.id || ''}
      />

      <ShareInviteModal
        isOpen={showShareInviteModal}
        onClose={() => setShowShareInviteModal(false)}
        inviteCode={event.invite_code}
        eventName={event.event_name}
      />

      <VendorDetailModal
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
      />

      <VendorSocialMediaModal
        isOpen={showVendorSocialModal}
        onClose={() => setShowVendorSocialModal(false)}
        vendors={vendors.map(v => ({
          id: v.id,
          name: v.first_name && v.last_name
            ? `${v.first_name} ${v.last_name}`
            : v.business_name || v.vendor_type,
          vendor_type: v.occupation || v.vendor_type,
          instagram_handle: v.instagram_handle,
          facebook_handle: v.facebook_handle,
          tiktok_handle: v.tiktok_handle,
          website: v.website,
        }))}
      />

      {showAddVendorChoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Vendor</h2>
              <button
                onClick={() => setShowAddVendorChoiceModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddVendorChoiceModal(false);
                  setShowAddVendorModal(true);
                }}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">Add from Contacts</h3>
                  <p className="text-sm text-gray-600">Select vendors from your contact list</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddVendorChoiceModal(false);
                  setShowShareInviteModal(true);
                }}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                  <Share2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">Share Invite Code</h3>
                  <p className="text-sm text-gray-600">Send invite code to add vendors</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Media Link</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  placeholder="e.g., Wedding Photos Album"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMediaModal(false);
                  setNewMediaTitle('');
                  setNewMediaUrl('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedia}
                disabled={!newMediaTitle.trim() || !newMediaUrl.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
