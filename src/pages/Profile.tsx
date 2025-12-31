import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Settings, ChevronRight, Instagram, Globe, Phone, Mail, Building, Briefcase, MessageSquare, Edit3, Save, LogOut, X } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  occupation: string;
  company_name: string;
  instagram_handle: string;
  facebook_handle: string;
  tiktok_handle: string;
  website: string;
  profile_photo_url: string | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    occupation: '',
    company_name: '',
    instagram_handle: '',
    facebook_handle: '',
    tiktok_handle: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        occupation: data.occupation || '',
        company_name: data.company_name || '',
        instagram_handle: data.instagram_handle || '',
        facebook_handle: data.facebook_handle || '',
        tiktok_handle: data.tiktok_handle || '',
        website: data.website || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        bio: formData.bio,
        occupation: formData.occupation,
        company_name: formData.company_name,
        instagram_handle: formData.instagram_handle,
        facebook_handle: formData.facebook_handle,
        tiktok_handle: formData.tiktok_handle,
        website: formData.website,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      alert('Failed to update profile');
    } else {
      setIsEditing(false);
      fetchProfile();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = formData.first_name && formData.last_name
    ? `${formData.first_name} ${formData.last_name}`
    : user?.email?.split('@')[0] || 'User';

  const initials = formData.first_name && formData.last_name
    ? `${formData.first_name[0]}${formData.last_name[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <DashboardLayout
      title="Profile"
      rightAction={
        !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-white font-medium active:opacity-70 transition-opacity"
          >
            Edit
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-white font-medium active:opacity-70 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )
      }
    >
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="safe-area-top" />

        <div className="px-4 pt-4 pb-6">
          <div className="flex flex-col items-center mb-6">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-white">{initials}</span>
              </div>
            )}
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-white/50">{user?.email}</p>
            {formData.occupation && (
              <span className="mt-2 px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm font-medium">
                {formData.occupation}
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white/50 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Last name"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Phone number"
                  />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none resize-none"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white/50 mb-4">Professional Details</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Occupation"
                  />
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white/50 mb-4">Social & Website</h3>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Website URL"
                  />
                  <input
                    type="text"
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="Instagram @handle"
                  />
                  <input
                    type="text"
                    value={formData.tiktok_handle}
                    onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                    placeholder="TikTok @handle"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                className="w-full py-4 text-white/50 font-medium active:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(formData.phone || formData.occupation || formData.company_name || formData.bio) && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-sm font-medium text-white/50">About</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {formData.phone && (
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        <Phone className="w-5 h-5 text-white/30" />
                        <div>
                          <p className="text-xs text-white/40">Phone</p>
                          <p className="text-white">{formData.phone}</p>
                        </div>
                      </div>
                    )}
                    {formData.occupation && (
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        <Briefcase className="w-5 h-5 text-white/30" />
                        <div>
                          <p className="text-xs text-white/40">Occupation</p>
                          <p className="text-white">{formData.occupation}</p>
                        </div>
                      </div>
                    )}
                    {formData.company_name && (
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        <Building className="w-5 h-5 text-white/30" />
                        <div>
                          <p className="text-xs text-white/40">Company</p>
                          <p className="text-white">{formData.company_name}</p>
                        </div>
                      </div>
                    )}
                    {formData.bio && (
                      <div className="px-4 py-3.5">
                        <p className="text-xs text-white/40 mb-1">Bio</p>
                        <p className="text-white/80">{formData.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(formData.website || formData.instagram_handle || formData.tiktok_handle) && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-sm font-medium text-white/50">Links</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {formData.website && (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3.5 active:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Globe className="w-5 h-5 text-white/30" />
                          <span className="text-white">Website</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </a>
                    )}
                    {formData.instagram_handle && (
                      <a
                        href={`https://instagram.com/${formData.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3.5 active:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Instagram className="w-5 h-5 text-white/30" />
                          <span className="text-white">{formData.instagram_handle}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  <button
                    onClick={() => navigate('/dashboard/settings')}
                    className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Settings className="w-5 h-5 text-white/30" />
                      <span className="text-white">Settings</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                  <button
                    onClick={() => navigate('/feedback')}
                    className="w-full flex items-center justify-between px-4 py-3.5 active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <MessageSquare className="w-5 h-5 text-white/30" />
                      <span className="text-white">Send Feedback</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-4 text-red-400 font-medium active:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
