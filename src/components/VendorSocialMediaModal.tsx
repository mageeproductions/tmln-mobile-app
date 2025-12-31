import { useState } from 'react';
import { X, Instagram, Facebook, MessageCircle, Globe, Copy, Check } from 'lucide-react';

interface VendorSocialMedia {
  id: string;
  name: string;
  vendor_type: string;
  instagram_handle?: string;
  facebook_handle?: string;
  tiktok_handle?: string;
  website?: string;
}

interface VendorSocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: VendorSocialMedia[];
}

type PlatformType = 'instagram' | 'facebook' | 'tiktok' | 'website';

export default function VendorSocialMediaModal({ isOpen, onClose, vendors }: VendorSocialMediaModalProps) {
  const [copyModalPlatform, setCopyModalPlatform] = useState<PlatformType | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const instagramVendors = vendors.filter(v => v.instagram_handle);
  const facebookVendors = vendors.filter(v => v.facebook_handle);
  const tiktokVendors = vendors.filter(v => v.tiktok_handle);
  const websiteVendors = vendors.filter(v => v.website);

  const hasSocialMedia = instagramVendors.length > 0 || facebookVendors.length > 0 || tiktokVendors.length > 0 || websiteVendors.length > 0;

  const formatHandlesForCopy = (platform: PlatformType) => {
    let vendorsList: VendorSocialMedia[] = [];
    let handleKey: 'instagram_handle' | 'facebook_handle' | 'tiktok_handle' | 'website' = 'instagram_handle';

    switch (platform) {
      case 'instagram':
        vendorsList = instagramVendors;
        handleKey = 'instagram_handle';
        break;
      case 'facebook':
        vendorsList = facebookVendors;
        handleKey = 'facebook_handle';
        break;
      case 'tiktok':
        vendorsList = tiktokVendors;
        handleKey = 'tiktok_handle';
        break;
      case 'website':
        vendorsList = websiteVendors;
        handleKey = 'website';
        break;
    }

    return vendorsList.map(v => {
      let handle = v[handleKey] || '';
      if (platform !== 'website' && handle && !handle.startsWith('@')) {
        handle = '@' + handle;
      }
      return `${v.vendor_type}: ${handle}`;
    }).join('\n');
  };

  const handleCopyToClipboard = async () => {
    if (!copyModalPlatform) return;

    const text = formatHandlesForCopy(copyModalPlatform);
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
      setCopyModalPlatform(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Social Media</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!hasSocialMedia ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No social media information available</p>
              <p className="text-sm text-gray-400">
                Vendors haven't added their social media handles yet
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {instagramVendors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-6 h-6 text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Instagram</h3>
                      <span className="text-sm text-gray-500">({instagramVendors.length})</span>
                    </div>
                    <button
                      onClick={() => setCopyModalPlatform('instagram')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {instagramVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 hover:border-pink-300 transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                        </div>
                        <a
                          href={`https://instagram.com/${vendor.instagram_handle!.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition font-medium text-sm"
                        >
                          @{vendor.instagram_handle!.replace('@', '')}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {facebookVendors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Facebook</h3>
                      <span className="text-sm text-gray-500">({facebookVendors.length})</span>
                    </div>
                    <button
                      onClick={() => setCopyModalPlatform('facebook')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {facebookVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                        </div>
                        <a
                          href={`https://facebook.com/${vendor.facebook_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                          {vendor.facebook_handle}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tiktokVendors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-6 h-6 text-gray-900" />
                      <h3 className="text-lg font-semibold text-gray-900">TikTok</h3>
                      <span className="text-sm text-gray-500">({tiktokVendors.length})</span>
                    </div>
                    <button
                      onClick={() => setCopyModalPlatform('tiktok')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {tiktokVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                        </div>
                        <a
                          href={`https://tiktok.com/@${vendor.tiktok_handle!.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                        >
                          @{vendor.tiktok_handle!.replace('@', '')}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {websiteVendors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Websites</h3>
                      <span className="text-sm text-gray-500">({websiteVendors.length})</span>
                    </div>
                    <button
                      onClick={() => setCopyModalPlatform('website')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {websiteVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-300 transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                        </div>
                        <a
                          href={vendor.website!.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm truncate max-w-[200px]"
                        >
                          Visit Site
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {copyModalPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {copyModalPlatform.charAt(0).toUpperCase() + copyModalPlatform.slice(1)} Handles
              </h3>
              <button
                onClick={() => {
                  setCopyModalPlatform(null);
                  setCopied(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={handleCopyToClipboard}
                disabled={copied}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[400px] overflow-y-auto">
              <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                {formatHandlesForCopy(copyModalPlatform)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
