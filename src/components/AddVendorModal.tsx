import { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  contact_user_id: string;
  first_name: string;
  last_name: string;
  occupation: string;
  profile_photo_url: string;
}

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  userId: string;
}

export default function AddVendorModal({ isOpen, onClose, onSuccess, eventId, userId }: AddVendorModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [existingVendors, setExistingVendors] = useState<Set<string>>(new Set());
  const [pendingInvitations, setPendingInvitations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, eventId, userId]);

  const loadData = async () => {
    await fetchExistingVendorsAndInvitations();
    await fetchContacts();
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(contact =>
          `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
          contact.occupation?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, contacts]);

  const fetchExistingVendorsAndInvitations = async () => {
    const { data: vendorsData } = await supabase
      .from('event_vendors')
      .select('user_id')
      .eq('event_id', eventId)
      .not('user_id', 'is', null);

    if (vendorsData) {
      setExistingVendors(new Set(vendorsData.map(v => v.user_id)));
    }

    const { data: invitationsData } = await supabase
      .from('event_vendor_invitations')
      .select('vendor_id')
      .eq('event_id', eventId)
      .eq('status', 'pending');

    if (invitationsData) {
      setPendingInvitations(new Set(invitationsData.map(i => i.vendor_id)));
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        contact_user_id,
        profiles:contact_user_id (
          first_name,
          last_name,
          occupation,
          profile_photo_url
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } else if (data) {
      const formattedContacts = data
        .map((contact: any) => ({
          id: contact.id,
          contact_user_id: contact.contact_user_id,
          first_name: contact.profiles?.first_name || '',
          last_name: contact.profiles?.last_name || '',
          occupation: contact.profiles?.occupation || '',
          profile_photo_url: contact.profiles?.profile_photo_url || '',
        }))
        .filter(c => !existingVendors.has(c.contact_user_id) && !pendingInvitations.has(c.contact_user_id));

      setContacts(formattedContacts);
      setFilteredContacts(formattedContacts);
    }
    setLoading(false);
  };

  const toggleContact = (contactUserId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactUserId)) {
      newSelected.delete(contactUserId);
    } else {
      newSelected.add(contactUserId);
    }
    setSelectedContacts(newSelected);
  };

  const handleAddVendors = async () => {
    if (selectedContacts.size === 0) {
      setError('Please select at least one contact');
      return;
    }

    setLoading(true);
    setError('');

    const invitationsToAdd = Array.from(selectedContacts).map(contactUserId => {
      const contact = contacts.find(c => c.contact_user_id === contactUserId);
      return {
        event_id: eventId,
        vendor_id: contactUserId,
        vendor_type: contact?.occupation || 'Vendor',
        notes: 'Added from contacts',
        status: 'pending',
        invited_by: userId,
      };
    });

    const { error: insertError } = await supabase
      .from('event_vendor_invitations')
      .insert(invitationsToAdd);

    if (insertError) {
      console.error('Error adding vendor invitations:', insertError);
      setError('Failed to add vendors. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedContacts(new Set());
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Vendors from Contacts</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'No contacts found matching your search' : 'No contacts available'}
              </p>
              <p className="text-sm text-gray-400">
                {!searchQuery && 'Add contacts first to invite them as vendors'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => toggleContact(contact.contact_user_id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition cursor-pointer ${
                    selectedContacts.has(contact.contact_user_id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                      {contact.first_name[0]}{contact.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.occupation && (
                        <p className="text-sm text-gray-600">{contact.occupation}</p>
                      )}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedContacts.has(contact.contact_user_id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedContacts.has(contact.contact_user_id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddVendors}
            disabled={loading || selectedContacts.size === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Adding...' : `Add ${selectedContacts.size > 0 ? `(${selectedContacts.size})` : 'Vendors'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
