
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { capitalizeClientName } from '@/utils/clientNameUtils';

interface IncidentCreationOverlayProps {
  isVisible: boolean;
}

const IncidentCreationOverlay = ({ isVisible }: IncidentCreationOverlayProps) => {
  const { user, employeeData } = useAuth();
  
  // Get client info from user or employeeData
  const clientLogo = user?.client?.logo || employeeData?.client?.logo;
  const clientName = capitalizeClientName(user?.client?.name || employeeData?.client?.name) || 'Your School';

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9998] flex flex-col items-center justify-center overflow-hidden">
      {/* Enhanced Animated Background - Same as AuthLoadingOverlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-100/30 via-transparent to-blue-100/30"></div>
      </div>
      
      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200/40 rounded-full blur-xl animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-300/40 rounded-full blur-lg animate-float-medium"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-primary-300/40 rounded-full blur-md animate-float-fast"></div>
        <div className="absolute bottom-1/3 right-1/3 w-28 h-28 bg-indigo-200/40 rounded-full blur-lg animate-float-reverse"></div>
      </div>
      
      {/* Enhanced Content Card */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 p-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-primary-200/50 max-w-lg mx-4">
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-blue-400/20 to-indigo-400/20 rounded-2xl blur-xl"></div>
        
        {/* Enhanced Logo Area */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse"></div>
          <div className="relative w-20 h-20 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full border-2 border-primary-200/50 shadow-xl shadow-primary-200/20">
            {clientLogo ? (
              <img 
                src={clientLogo} 
                alt={`${clientName} logo`}
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-inner">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md shadow-sm"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Message */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-blue-600 bg-clip-text text-transparent">
            Creating Incident Report
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Please wait while we securely save your incident report for <span className="font-semibold text-primary-600">{clientName}</span>
          </p>
        </div>
        
        {/* Enhanced Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-md animate-pulse"></div>
            <div className="relative flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-primary-200/50 shadow-lg shadow-primary-200/10">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-sm animate-pulse"></div>
              </div>
              <span className="text-sm font-medium text-primary-700">Processing securely...</span>
            </div>
          </div>
          
          {/* Enhanced Progress Dots */}
          <div className="flex space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full animate-bounce shadow-lg shadow-primary-300/50"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-300/50" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full animate-bounce shadow-lg shadow-indigo-300/50" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCreationOverlay;
