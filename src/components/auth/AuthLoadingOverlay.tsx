
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthLoadingOverlayProps {
  isVisible: boolean;
}

const AuthLoadingOverlay = ({ isVisible }: AuthLoadingOverlayProps) => {
  const { user, employeeData } = useAuth();
  
  // Get client info from user or employeeData
  const clientLogo = user?.client?.logo || employeeData?.client?.logo;
  const clientName = user?.client?.name || employeeData?.client?.name || 'Your School';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* Client Logo */}
        <div className="w-20 h-20 flex items-center justify-center animate-pulse">
          {clientLogo ? (
            <img 
              src={clientLogo} 
              alt={`${clientName} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-600 rounded"></div>
            </div>
          )}
        </div>
        
        {/* Welcome Text */}
        <div className="text-center">
          <p className="text-gray-600">Welcome to {clientName}'s Safety Command Center</p>
        </div>
        
        {/* Animated Spinner */}
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="text-sm text-gray-500">Setting up your workspace</span>
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
