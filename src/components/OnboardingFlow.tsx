import { useState, useRef } from 'react';
import { User, Mail, Lock, Briefcase, Camera, Calendar, Share2, HelpCircle, ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  occupation: string;
  profilePhoto: File | null;
  profilePhotoPreview: string;
  eventsPerYear: string;
  businessName: string;
  phone: string;
  website: string;
  instagramHandle: string;
  facebookHandle: string;
  tiktokHandle: string;
  referralSource: string;
  excitedFeatures: string[];
}

interface OnboardingFlowProps {
  onComplete: (eventsPerYear: string) => void;
  onBack: () => void;
}

const TOTAL_STEPS = 8;

const REFERRAL_OPTIONS = [
  'Social Media',
  'Friend or Colleague',
  'Google Search',
  'Wedding Vendor',
  'Industry Event',
  'Blog or Article',
  'Podcast',
  'Prefer not to say'
];

const EVENTS_OPTIONS = [
  { value: '1-2', label: '1-2 events', description: 'Just getting started' },
  { value: '3-5', label: '3-5 events', description: 'Building my portfolio' },
  { value: '6-10', label: '6-10 events', description: 'Established professional' },
  { value: '11-20', label: '11-20 events', description: 'Busy season ahead' },
  { value: '20+', label: '20+ events', description: 'High-volume business' }
];

const FEATURE_OPTIONS = [
  'Live, Dynamic Timeline',
  'All Vendor Social Media Handles',
  'Location Information',
  'Sharing Galleries/Videos Once to Everyone',
  'Vendor Group Chat',
  'Everything!'
];

export default function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    occupation: '',
    profilePhoto: null,
    profilePhotoPreview: '',
    eventsPerYear: '',
    businessName: '',
    phone: '',
    website: '',
    instagramHandle: '',
    facebookHandle: '',
    tiktokHandle: '',
    referralSource: '',
    excitedFeatures: []
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.firstName.trim().length > 0 && data.lastName.trim().length > 0;
      case 2:
        return data.email.trim().length > 0 &&
               data.password.length >= 6 &&
               data.password === data.confirmPassword;
      case 3:
        return data.occupation.trim().length > 0;
      case 4:
        return true;
      case 5:
        return data.eventsPerYear !== '';
      case 6:
        return true;
      case 7:
        return data.excitedFeatures.length > 0;
      case 8:
        return data.referralSource !== '';
      default:
        return false;
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({
          profilePhoto: file,
          profilePhotoPreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const goToStep = (step: number) => {
    if (step < 1 || step > TOTAL_STEPS) return;
    if (step > currentStep && !canProceed()) return;

    setDirection(step > currentStep ? 'forward' : 'back');
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentStep(step);
      setIsTransitioning(false);
    }, 200);
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    if (currentStep === 2) {
      setLoading(true);
      setError('');

      try {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: data.firstName,
              last_name: data.lastName,
              email: data.email,
              onboarding_completed: false
            })
            .eq('id', authData.user.id);

          if (profileError) throw profileError;
        }

        setLoading(false);
        goToStep(currentStep + 1);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to create account');
      }
      return;
    }

    if (currentStep === TOTAL_STEPS) {
      await handleComplete();
      return;
    }

    goToStep(currentStep + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let profilePhotoUrl = '';

      if (data.profilePhoto) {
        const fileExt = data.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, data.profilePhoto, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);
          profilePhotoUrl = urlData.publicUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          occupation: data.occupation,
          profile_photo_url: profilePhotoUrl || undefined,
          events_per_year: data.eventsPerYear,
          company_name: data.businessName || '',
          phone: data.phone || '',
          website: data.website || '',
          instagram_handle: data.instagramHandle || '',
          facebook_handle: data.facebookHandle || '',
          tiktok_handle: data.tiktokHandle || '',
          referral_source: data.referralSource,
          excited_features: data.excitedFeatures,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onComplete(data.eventsPerYear);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const transitionClass = isTransitioning
      ? `opacity-0 ${direction === 'forward' ? 'translate-x-4' : '-translate-x-4'}`
      : 'opacity-100 translate-x-0';

    switch (currentStep) {
      case 1:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Let's start with your name</h2>
              <p className="text-gray-400">This is how you'll appear to other vendors and clients on TMLN.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">First Name</label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => updateData({ firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Your first name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => updateData({ lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Your last name"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How can we reach you?</h2>
              <p className="text-gray-400">Your email is used for signing in and important event notifications.</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/60 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={data.password}
                    onChange={(e) => updateData({ password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={data.confirmPassword}
                    onChange={(e) => updateData({ confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Type your password again"
                  />
                </div>
                {data.confirmPassword && data.password !== data.confirmPassword && (
                  <p className="text-red-400 text-sm mt-2">Passwords don't match</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What do you do?</h2>
              <p className="text-gray-400">Help other vendors understand your role so they can coordinate with you more effectively.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Your Occupation</label>
              <input
                type="text"
                value={data.occupation}
                onChange={(e) => updateData({ occupation: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="e.g., Wedding Photographer, DJ, Florist"
                autoFocus
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Show us your best angle</h2>
              <p className="text-gray-400">A profile photo helps clients and vendors recognize you at events. This step is optional.</p>
            </div>

            <div className="flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {data.profilePhotoPreview ? (
                <div className="relative">
                  <img
                    src={data.profilePhotoPreview}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/50"
                  />
                  <button
                    onClick={() => updateData({ profilePhoto: null, profilePhotoPreview: '' })}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full bg-gray-800/80 border-2 border-dashed border-gray-500 hover:border-purple-500 flex flex-col items-center justify-center transition-all hover:bg-gray-800"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Add Photo</span>
                </button>
              )}

              {data.profilePhotoPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  Choose a different photo
                </button>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How busy is your calendar?</h2>
              <p className="text-gray-400">This helps us tailor TMLN to your workflow and recommend the right features.</p>
            </div>

            <div className="space-y-3">
              {EVENTS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateData({ eventsPerYear: option.value })}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    data.eventsPerYear === option.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{option.label}</p>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                    {data.eventsPerYear === option.value && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tell us about your business</h2>
              <p className="text-gray-400">Share your business details and social handles so vendors can check out your work. All fields are optional.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Business Name</label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => updateData({ businessName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateData({ phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Website</label>
                <input
                  type="url"
                  value={data.website}
                  onChange={(e) => updateData({ website: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Instagram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={data.instagramHandle}
                    onChange={(e) => updateData({ instagramHandle: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="yourhandle"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">TikTok</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={data.tiktokHandle}
                    onChange={(e) => updateData({ tiktokHandle: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="yourhandle"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What excites you most?</h2>
              <p className="text-gray-400">Select all the features you're most excited to use in TMLN.</p>
            </div>

            <div className="space-y-2">
              {FEATURE_OPTIONS.map((feature) => {
                const isSelected = feature === 'Everything!'
                  ? data.excitedFeatures.length === FEATURE_OPTIONS.length - 1
                  : data.excitedFeatures.includes(feature);

                return (
                  <button
                    key={feature}
                    onClick={() => {
                      if (feature === 'Everything!') {
                        if (data.excitedFeatures.length === FEATURE_OPTIONS.length - 1) {
                          updateData({ excitedFeatures: [] });
                        } else {
                          updateData({ excitedFeatures: FEATURE_OPTIONS.filter(f => f !== 'Everything!') });
                        }
                      } else {
                        if (data.excitedFeatures.includes(feature)) {
                          updateData({
                            excitedFeatures: data.excitedFeatures.filter(f => f !== feature)
                          });
                        } else {
                          updateData({
                            excitedFeatures: [...data.excitedFeatures, feature]
                          });
                        }
                      }
                    }}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white">{feature}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 8:
        return (
          <div className={`transition-all duration-200 ease-out ${transitionClass}`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">One last thing!</h2>
              <p className="text-gray-400">We're curious how you discovered TMLN. This helps us connect with more amazing vendors like you.</p>
            </div>

            <div className="space-y-2">
              {REFERRAL_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => updateData({ referralSource: option })}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    data.referralSource === option
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{option}</span>
                    {data.referralSource === option && (
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
        <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(139,92,246,0.4)] overflow-hidden border border-purple-400/40">
          <div className="h-1 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => currentStep === 1 ? onBack() : goToStep(currentStep - 1)}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
              <span className="text-sm text-gray-400">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
            </div>

            <div className="min-h-[400px] flex flex-col">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              <div className="mt-8">
                {error && currentStep !== 2 && (
                  <div className="bg-red-500/20 border border-red-400/60 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {currentStep === 6 ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-semibold transition-all text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Skip for now
                    </button>
                    <p className="text-center text-gray-500 text-sm">
                      You can always add these later in your profile
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      canProceed() && !loading
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
