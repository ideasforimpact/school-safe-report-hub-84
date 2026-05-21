import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { capitalizeClientName } from '@/utils/clientNameUtils';

interface AuthLoadingOverlayProps {
  isVisible: boolean;
}
// const AUTH_CLIENT_NAME_KEY = 'clientName';

const AuthLoadingOverlay = ({ isVisible }: AuthLoadingOverlayProps) => {
  const { user, employeeData } = useAuth();

  const [displayName, setDisplayName] = useState<string>('');

  const clientLogo = user?.client?.logo || employeeData?.client?.logo;

  useEffect(() => {
    const raw = user?.client?.name ?? employeeData?.client?.name;

    if (raw) {
      setDisplayName(capitalizeClientName(raw));
    } else {
      setDisplayName('');
    }
  }, [user?.client?.name, employeeData?.client?.name]);

  if (!isVisible || !displayName) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50 z-[9999] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200/30 rounded-full animate-float-slow"></div>
        <div className="absolute top-40 right-32 w-20 h-20 bg-secondary-200/40 rounded-lg rotate-45 animate-float-medium animation-delay-2000"></div>
        <div className="absolute bottom-32 left-40 w-16 h-16 bg-primary-300/25 rounded-full animate-float-fast animation-delay-4000"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-blue-200/30 rotate-12 animate-float-reverse"></div>
        <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-secondary-300/50 rounded-full animate-bounce"></div>
        <div className="absolute top-2/3 right-1/3 w-12 h-12 bg-primary-400/20 rounded-lg animate-pulse"></div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        {/* Glassmorphism Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-12 max-w-md w-full text-center animate-scale-in">
          {/* Client Logo Section */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto relative">
              {/* Logo Background Glow */}
              <div className="absolute inset-0 bg-primary-400/20 rounded-2xl blur-xl animate-pulse"></div>
              
              {clientLogo ? (
                <div className="relative z-10 w-full h-full bg-white rounded-2xl shadow-lg p-3">
                  <img
                    src={clientLogo}
                    alt={displayName ? `${displayName} logo` : 'client logo'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative z-10 w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-inner flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary-600 rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Welcome Text */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {displayName ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    {displayName}'s
                  </span>
                </h2>
                <h3 className="text-xl font-semibold text-primary-700">Safety Command Center</h3>
              </>
            ) : (
              <>
                {/* <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">Welcome</h2>
                <h3 className="text-xl font-semibold text-primary-700">Safety Command Center</h3> */}
              </>
            )}
            <p className="text-gray-600 mt-2 text-sm">Your comprehensive safety management platform</p>
          </div>
          
          {/* Enhanced Loading Section */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {/* Animated Spinner with Glow */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary-400/30 rounded-full blur-md animate-pulse"></div>
              <Loader2 className="relative h-8 w-8 animate-spin text-primary-600 mx-auto" />
            </div>
            
            <p className="text-primary-700 font-medium mb-4">Setting up your workspace</p>
            
            {/* Enhanced Progress Animation */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-bounce shadow-lg"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse shadow-sm"></div>
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center justify-center text-xs text-gray-500 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Secure Connection Established
          </div>
        </div>
        
        {/* Floating Elements Around Card */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary-300/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-secondary-300/30 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
