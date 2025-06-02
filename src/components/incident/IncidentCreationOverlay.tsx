
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface IncidentCreationOverlayProps {
  isVisible: boolean;
}

const IncidentCreationOverlay = ({ isVisible }: IncidentCreationOverlayProps) => {
  const { user, employeeData } = useAuth();
  
  // Get client info from user or employeeData
  const clientLogo = user?.client?.logo || employeeData?.client?.logo;
  const clientName = user?.client?.name || employeeData?.client?.name || 'Your School';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9998] flex flex-col items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-lg shadow-lg border max-w-md mx-4">
        {/* Client Logo */}
        <div className="w-16 h-16 flex items-center justify-center">
          {clientLogo ? (
            <img 
              src={clientLogo} 
              alt={`${clientName} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-600 rounded"></div>
            </div>
          )}
        </div>
        
        {/* Message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Incident Report</h3>
          <p className="text-gray-600">Please wait while we save your incident report...</p>
        </div>
        
        {/* Animated Spinner */}
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="text-sm text-gray-500">Processing...</span>
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

export default IncidentCreationOverlay;
