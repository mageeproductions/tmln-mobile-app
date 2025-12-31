import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingFlow from '../components/OnboardingFlow';

export function SignupPage() {
  const navigate = useNavigate();

  const handleOnboardingComplete = (eventsPerYear: string) => {
    const highVolumeUsers = ['11-20', '20+'];

    if (highVolumeUsers.includes(eventsPerYear)) {
      navigate('/success?recommended=pro');
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.4),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative z-10">
        <OnboardingFlow onComplete={handleOnboardingComplete} onBack={handleBack} />
      </div>
    </div>
  );
}