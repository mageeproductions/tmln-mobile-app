import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Users, Search, UserPlus, X, ChevronDown, ChevronUp, Mail, Phone as PhoneIcon, Briefcase, Globe, Instagram, Facebook, MessageCircle } from 'lucide-react';

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

type SortField = 'name' | 'occupation';
type SortDirection = 'asc' | 'desc';

export default function Contacts() {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

    const { data: savedContacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        contact_user_id,
        profiles!contacts_contact_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          company_name,
          occupation,
          phone,
          bio,
          website,
          instagram_handle,
          facebook_handle,
          tiktok_handle,
          profile_photo_url
        )
      `)
      .eq('user_id', user.id);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    } else {
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
    }

    const { data: eventMembersData, error: membersError } = await supabase
      .from('event_members')
      .select(`
        event_id,
        user_id,
        profiles!event_members_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          company_name,
          occupation,
          phone,
          bio,
          website,
          instagram_handle,
          facebook_handle,
          tiktok_handle,
          profile_photo_url
        )
      `)
      .neq('user_id', user.id);

    if (membersError) {
      console.error('Error fetching event members:', membersError);
    } else {
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

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, company_name, occupation, phone, bio, website, instagram_handle, facebook_handle, tiktok_handle, profile_photo_url')
      .ilike('email', `%${emailSearch.trim()}%`)
      .neq('id', user.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      setSearching(false);
      return;
    }

    const contactIds = new Set(contacts.map(c => c.id));
    const filteredResults = (data || []).filter(profile => !contactIds.has(profile.id));

    setSearchResults(filteredResults);
    setSearching(false);
  };

  const addContact = async (contactUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAdding(contactUserId);

    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      contact_user_id: contactUserId,
    });

    if (error) {
      console.error('Error adding contact:', error);
      setAdding(null);
      return;
    }

    setAdding(null);
    setShowAddModal(false);
    setEmailSearch('');
    setSearchResults([]);
    fetchContacts();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
      let compareResult = 0;

      if (sortField === 'name') {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        compareResult = nameA.localeCompare(nameB);
      } else if (sortField === 'occupation') {
        const occA = (a.occupation || '').toLowerCase();
        const occB = (b.occupation || '').toLowerCase();
        compareResult = occA.localeCompare(occB);
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contacts</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your clients and vendors</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Add Contact</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="relative max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Name
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('occupation')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Occupation
                      {sortField === 'occupation' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading contacts...
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {contact.profile_photo_url ? (
                            <img
                              src={contact.profile_photo_url}
                              alt={`${contact.first_name} ${contact.last_name}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {contact.first_name[0]}{contact.last_name[0]}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{contact.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{contact.company_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                          {contact.occupation || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{contact.phone || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Contact</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEmailSearch('');
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Search for users by email to add them to your contacts
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={emailSearch}
                  onChange={(e) => {
                    setEmailSearch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !searching) {
                      searchForUsers();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={searchForUsers}
                disabled={searching || !emailSearch.trim()}
                className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Search Results
                  </p>
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile.first_name} {profile.last_name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {profile.email}
                          </p>
                          {profile.company_name && (
                            <p className="text-xs text-gray-500 truncate">
                              {profile.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addContact(profile.id)}
                        disabled={adding === profile.id}
                        className="ml-3 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        {adding === profile.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : emailSearch && !searching ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found with this email</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try searching for a different email address
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                {selectedContact.profile_photo_url ? (
                  <img
                    src={selectedContact.profile_photo_url}
                    alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                    className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                    {selectedContact.first_name[0]}{selectedContact.last_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </h3>
                  {selectedContact.occupation && (
                    <p className="text-purple-600 font-medium text-lg mb-2">{selectedContact.occupation}</p>
                  )}
                  {selectedContact.company_name && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {selectedContact.company_name}
                    </p>
                  )}
                </div>
              </div>

              {selectedContact.bio && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">About</h4>
                  <p className="text-gray-900 leading-relaxed">{selectedContact.bio}</p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact Information</h4>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="text-gray-900 hover:text-purple-600 transition break-all"
                      >
                        {selectedContact.email}
                      </a>
                    </div>
                  </div>

                  {selectedContact.phone && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <PhoneIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Phone</p>
                        <a
                          href={`tel:${selectedContact.phone}`}
                          className="text-gray-900 hover:text-purple-600 transition"
                        >
                          {selectedContact.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedContact.website && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Website</p>
                        <a
                          href={selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-purple-600 transition break-all"
                        >
                          {selectedContact.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {(selectedContact.instagram_handle || selectedContact.facebook_handle || selectedContact.tiktok_handle) && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-6">Social Media</h4>
                    <div className="grid gap-4">
                      {selectedContact.instagram_handle && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Instagram className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 mb-1">Instagram</p>
                            <a
                              href={`https://instagram.com/${selectedContact.instagram_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:text-purple-600 transition"
                            >
                              @{selectedContact.instagram_handle.replace('@', '')}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedContact.facebook_handle && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Facebook className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 mb-1">Facebook</p>
                            <a
                              href={`https://facebook.com/${selectedContact.facebook_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:text-purple-600 transition"
                            >
                              {selectedContact.facebook_handle}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedContact.tiktok_handle && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 mb-1">TikTok</p>
                            <a
                              href={`https://tiktok.com/@${selectedContact.tiktok_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:text-purple-600 transition"
                            >
                              @{selectedContact.tiktok_handle.replace('@', '')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
