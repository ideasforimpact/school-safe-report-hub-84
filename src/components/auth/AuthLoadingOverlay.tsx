
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useClient } from '@/contexts/ClientContext';
import { useAuth } from '@/contexts/AuthContext';

interface AuthLoadingOverlayProps {
  isVisible: boolean;
}

const AuthLoadingOverlay = ({ isVisible }: AuthLoadingOverlayProps) => {
  const { user } = useAuth();
  const { clients } = useClient();
  
  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* Client Logo */}
        <div className="w-20 h-20 flex items-center justify-center animate-pulse">
          {userClient?.logo ? (
            <img 
              src={userClient.logo} 
              alt={`${userClient.name} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-600 rounded"></div>
            </div>
          )}
        </div>
        
        {/* Safe School Text */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Safe School</h1>
          <p className="text-gray-600">Loading your safety platform...</p>
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
