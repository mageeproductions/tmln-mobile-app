import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Users, Search, UserPlus, X, Mail, Phone as PhoneIcon, Briefcase, Globe, Instagram, ChevronRight } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  occupation: string;
  phone: string;
  bio?: string;
  website?: string;
  instagram_handle?: string;
  facebook_handle?: string;
  tiktok_handle?: string;
  profile_photo_url?: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const uniqueContactsMap = new Map<string, Profile>();

    const { data: savedContacts } = await supabase
      .from('contacts')
      .select(`
        contact_user_id,
        profiles!contacts_contact_user_id_fkey (
          id, first_name, last_name, email, company_name, occupation, phone, bio, website, instagram_handle, facebook_handle, tiktok_handle, profile_photo_url
        )
      `)
      .eq('user_id', user.id);

    savedContacts?.forEach((contact: any) => {
      if (contact.profiles) {
        const profile = contact.profiles;
        uniqueContactsMap.set(profile.id, {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          company_name: profile.company_name || '',
          occupation: profile.occupation || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          website: profile.website || '',
          instagram_handle: profile.instagram_handle || '',
          facebook_handle: profile.facebook_handle || '',
          tiktok_handle: profile.tiktok_handle || '',
          profile_photo_url: profile.profile_photo_url || ''
        });
      }
    });

    const { data: eventMembersData } = await supabase
      .from('event_members')
      .select(`
        event_id, user_id,
        profiles!event_members_user_id_fkey (
          id, first_name, last_name, email, company_name, occupation, phone, bio, website, instagram_handle, facebook_handle, tiktok_handle, profile_photo_url
        )
      `)
      .neq('user_id', user.id);

    const myEventIds = await supabase
      .from('event_members')
      .select('event_id')
      .eq('user_id', user.id);

    if (myEventIds.data) {
      const myEventIdsSet = new Set(myEventIds.data.map(e => e.event_id));

      eventMembersData?.forEach((member: any) => {
        if (myEventIdsSet.has(member.event_id) && member.profiles) {
          const profile = member.profiles;
          if (!uniqueContactsMap.has(profile.id)) {
            uniqueContactsMap.set(profile.id, {
              id: profile.id,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              email: profile.email || '',
              company_name: profile.company_name || '',
              occupation: profile.occupation || '',
              phone: profile.phone || '',
              bio: profile.bio || '',
              website: profile.website || '',
              instagram_handle: profile.instagram_handle || '',
              facebook_handle: profile.facebook_handle || '',
              tiktok_handle: profile.tiktok_handle || '',
              profile_photo_url: profile.profile_photo_url || ''
            });
          }
        }
      });
    }

    setContacts(Array.from(uniqueContactsMap.values()));
    setLoading(false);
  };

  const searchForUsers = async () => {
    if (!emailSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSearching(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, company_name, occupation, phone, profile_photo_url')
      .ilike('email', `%${emailSearch.trim()}%`)
      .neq('id', user.id)
      .limit(10);

    const contactIds = new Set(contacts.map(c => c.id));
    const filteredResults = (data || []).filter(profile => !contactIds.has(profile.id));

    setSearchResults(filteredResults as Profile[]);
    setSearching(false);
  };

  const addContact = async (contactUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAdding(contactUserId);

    await supabase.from('contacts').insert({
      user_id: user.id,
      contact_user_id: contactUserId,
    });

    setAdding(null);
    setShowAddModal(false);
    setEmailSearch('');
    setSearchResults([]);
    fetchContacts();
  };

  const filteredContacts = contacts
    .filter(contact =>
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.occupation || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <DashboardLayout
      title="Contacts"
      rightAction={
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <UserPlus className="w-5 h-5 text-black" />
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
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-white/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No contacts yet</h3>
              <p className="text-white/50 text-center mb-6">Add contacts to connect with vendors and team members</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium active:scale-95 transition-transform"
              >
                <UserPlus className="w-5 h-5" />
                Add Contact
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl active:scale-[0.98] transition-transform"
                >
                  {contact.profile_photo_url ? (
                    <img
                      src={contact.profile_photo_url}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.first_name[0]}{contact.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-medium truncate">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.occupation && (
                      <p className="text-white/50 text-sm truncate">{contact.occupation}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 animate-slide-up">
            <div
              className="bg-[#1A1A1A] rounded-t-3xl overflow-hidden max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3" />
              <div className="p-6 pt-4">
                <h2 className="text-xl font-semibold text-white mb-1">Add Contact</h2>
                <p className="text-white/50 text-sm mb-4">Search by email to add a contact</p>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchForUsers()}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
                  />
                </div>
                <button
                  onClick={searchForUsers}
                  disabled={searching || !emailSearch.trim()}
                  className="w-full mt-3 py-3.5 bg-white text-black rounded-2xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((profile) => (
                      <div key={profile.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {profile.first_name} {profile.last_name}
                          </p>
                          <p className="text-white/50 text-sm truncate">{profile.email}</p>
                        </div>
                        <button
                          onClick={() => addContact(profile.id)}
                          disabled={adding === profile.id}
                          className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {adding === profile.id ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : emailSearch && !searching ? (
                  <div className="text-center py-8">
                    <p className="text-white/50">No users found</p>
                  </div>
                ) : null}
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-4 text-white/50 font-medium active:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="safe-area-bottom bg-[#1A1A1A]" />
            </div>
          </div>
        </div>
      )}

      {selectedContact && (
        <div className="fixed inset-0 z-50" onClick={() => setSelectedContact(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 animate-slide-up">
            <div
              className="bg-[#1A1A1A] rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3" />
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  {selectedContact.profile_photo_url ? (
                    <img
                      src={selectedContact.profile_photo_url}
                      alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                      {selectedContact.first_name[0]}{selectedContact.last_name[0]}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </h3>
                  {selectedContact.occupation && (
                    <p className="text-white/60">{selectedContact.occupation}</p>
                  )}
                </div>

                {selectedContact.bio && (
                  <div className="mb-4 p-4 bg-white/5 rounded-2xl">
                    <p className="text-white/80">{selectedContact.bio}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:bg-white/10 transition-colors">
                    <Mail className="w-5 h-5 text-white/40" />
                    <span className="text-white">{selectedContact.email}</span>
                  </a>
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:bg-white/10 transition-colors">
                      <PhoneIcon className="w-5 h-5 text-white/40" />
                      <span className="text-white">{selectedContact.phone}</span>
                    </a>
                  )}
                  {selectedContact.company_name && (
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                      <Briefcase className="w-5 h-5 text-white/40" />
                      <span className="text-white">{selectedContact.company_name}</span>
                    </div>
                  )}
                  {selectedContact.website && (
                    <a href={selectedContact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:bg-white/10 transition-colors">
                      <Globe className="w-5 h-5 text-white/40" />
                      <span className="text-white truncate">{selectedContact.website}</span>
                    </a>
                  )}
                  {selectedContact.instagram_handle && (
                    <a href={`https://instagram.com/${selectedContact.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:bg-white/10 transition-colors">
                      <Instagram className="w-5 h-5 text-white/40" />
                      <span className="text-white">@{selectedContact.instagram_handle.replace('@', '')}</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedContact(null)}
                  className="w-full py-4 mt-4 text-white/50 font-medium active:text-white/70 transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="safe-area-bottom bg-[#1A1A1A]" />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
