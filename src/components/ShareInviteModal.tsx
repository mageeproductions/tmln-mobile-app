import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  eventName: string;
}

export default function ShareInviteModal({ isOpen, onClose, inviteCode, eventName }: ShareInviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Share Invite Code</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Share this code with vendors to invite them to join <span className="font-semibold">{eventName}</span>
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Invite Code
              </label>
              <div className="flex items-center justify-center gap-3">
                <div className="text-4xl font-bold text-gray-900 tracking-widest font-mono">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-white rounded-lg transition"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Copy className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 text-center mt-2">Copied to clipboard!</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to share:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Copy the invite code above</li>
              <li>Send it to vendors via text, email, or messaging app</li>
              <li>They can use it to join the event from their dashboard</li>
            </ol>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
