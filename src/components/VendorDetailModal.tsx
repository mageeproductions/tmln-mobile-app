import { X, Mail, Phone, Briefcase, Globe, Instagram, Facebook, MessageCircle } from 'lucide-react';

interface VendorProfile {
  id: string;
  user_id: string | null;
  manual_contact_id: string | null;
  vendor_type: string;
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
  invitation_status?: string;
}

interface VendorDetailModalProps {
  vendor: VendorProfile | null;
  onClose: () => void;
}

export default function VendorDetailModal({ vendor, onClose }: VendorDetailModalProps) {
  if (!vendor) return null;

  const displayName = vendor.first_name && vendor.last_name
    ? `${vendor.first_name} ${vendor.last_name}`
    : vendor.company_name || vendor.vendor_type;

  const initials = vendor.first_name && vendor.last_name
    ? `${vendor.first_name[0]}${vendor.last_name[0]}`
    : vendor.company_name
    ? vendor.company_name.substring(0, 2).toUpperCase()
    : vendor.vendor_type.substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6 mb-6">
            {vendor.profile_photo_url ? (
              <img
                src={vendor.profile_photo_url}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {displayName}
              </h3>
              {vendor.occupation && (
                <p className="text-purple-600 font-medium text-lg mb-2">{vendor.occupation}</p>
              )}
              {vendor.company_name && vendor.first_name && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {vendor.company_name}
                </p>
              )}
              {vendor.invitation_status && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    vendor.invitation_status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : vendor.invitation_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {vendor.invitation_status}
                </span>
              )}
            </div>
          </div>

          {vendor.bio && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">About</h4>
              <p className="text-gray-900 leading-relaxed">{vendor.bio}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact Information</h4>

            <div className="grid gap-4">
              {vendor.email && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <a
                      href={`mailto:${vendor.email}`}
                      className="text-gray-900 hover:text-purple-600 transition break-all"
                    >
                      {vendor.email}
                    </a>
                  </div>
                </div>
              )}

              {vendor.phone && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-gray-900 hover:text-purple-600 transition"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                </div>
              )}

              {vendor.website && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1">Website</p>
                    <a
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-purple-600 transition break-all"
                    >
                      {vendor.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {(vendor.instagram_handle || vendor.facebook_handle || vendor.tiktok_handle) && (
              <>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-6">Social Media</h4>
                <div className="grid gap-4">
                  {vendor.instagram_handle && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Instagram className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Instagram</p>
                        <a
                          href={`https://instagram.com/${vendor.instagram_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-purple-600 transition"
                        >
                          @{vendor.instagram_handle.replace('@', '')}
                        </a>
                      </div>
                    </div>
                  )}

                  {vendor.facebook_handle && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Facebook className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Facebook</p>
                        <a
                          href={`https://facebook.com/${vendor.facebook_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-purple-600 transition"
                        >
                          {vendor.facebook_handle}
                        </a>
                      </div>
                    </div>
                  )}

                  {vendor.tiktok_handle && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">TikTok</p>
                        <a
                          href={`https://tiktok.com/@${vendor.tiktok_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-purple-600 transition"
                        >
                          @{vendor.tiktok_handle.replace('@', '')}
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
  );
}
