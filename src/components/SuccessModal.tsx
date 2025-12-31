import { ExternalLink, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-3xl p-8 sm:p-12 max-w-lg w-full shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>

        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">🎉</div>

          <h3 className="text-3xl font-bold">
            Thank you for signing up for early access!
          </h3>

          <p className="text-lg text-gray-300">
            To make the app as amazing as possible on launch, please fill out this survey to share your thoughts.
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <a
              href="https://forms.gle/rULNqLjebBU4kFXv5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 glow-purple hover:glow-purple-strong hover:scale-105"
            >
              Fill Out Survey
              <ExternalLink className="w-5 h-5" />
            </a>

            <button
              onClick={onClose}
              className="px-8 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
