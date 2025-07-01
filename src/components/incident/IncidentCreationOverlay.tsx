
import React from 'react';
import { Loader2, Shield, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { capitalizeClientName } from '@/utils/clientNameUtils';

interface IncidentCreationOverlayProps {
  isVisible: boolean;
}

const IncidentCreationOverlay = ({ isVisible }: IncidentCreationOverlayProps) => {
  const { user, employeeData } = useAuth();
  
  // Get client info from user or employeeData
  const clientLogo = user?.client?.logo || employeeData?.client?.logo;
  const clientName = capitalizeClientName(user?.client?.name || employeeData?.client?.name);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50/95 via-white/95 to-blue-50/95 backdrop-blur-md z-[9998] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-16 left-16 w-20 h-20 bg-primary-200/30 rounded-full animate-float-medium"></div>
        <div className="absolute top-32 right-24 w-16 h-16 bg-secondary-200/40 rotate-45 animate-float-fast animation-delay-2000"></div>
        <div className="absolute bottom-24 left-32 w-12 h-12 bg-primary-300/25 rounded-lg animate-float-slow animation-delay-4000"></div>
        <div className="absolute bottom-32 right-16 w-18 h-18 bg-blue-200/30 rounded-full animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-secondary-300/50 rotate-12 animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-8 h-8 bg-primary-400/20 rounded-full animate-pulse"></div>
        
        {/* Document-themed floating elements */}
        <div className="absolute top-20 right-40 opacity-10">
          <FileText className="w-12 h-12 text-primary-400 animate-float-slow" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10">
          <Shield className="w-10 h-10 text-secondary-400 animate-float-medium animation-delay-2000" />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/20"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Enhanced Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 max-w-lg w-full mx-4 text-center animate-scale-in">
          {/* Client Logo Section */}
          <div className="mb-6 relative">
            <div className="w-20 h-20 mx-auto relative">
              {/* Logo Background Glow */}
              <div className="absolute inset-0 bg-primary-400/30 rounded-2xl blur-lg animate-pulse"></div>
              
              {clientLogo ? (
                <div className="relative z-10 w-full h-full bg-white rounded-2xl shadow-xl p-2 animate-float-slow border border-gray-100">
                  <img 
                    src={clientLogo} 
                    alt={`${clientName} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative z-10 w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl flex items-center justify-center animate-float-slow">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-inner flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary-600 rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Message Section */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Creating Incident Report
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Please wait while we securely save your incident report to{' '}
              <span className="font-semibold text-primary-700">{clientName}'s</span> system
            </p>
          </div>
          
          {/* Enhanced Loading Animation */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Animated Spinner with Glow */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary-400/30 rounded-full blur-md animate-pulse"></div>
              <Loader2 className="relative h-8 w-8 animate-spin text-primary-600 mx-auto" />
            </div>
            
            <p className="text-primary-700 font-medium mb-4">Processing securely...</p>
            
            {/* Enhanced Progress Dots */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-primary-500 rounded-full animate-bounce shadow-lg"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-primary-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-primary-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-primary-500 rounded-full animate-pulse shadow-sm"></div>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Data encrypted and secure</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span>Generating incident ID</span>
            </div>
          </div>
        </div>
        
        {/* Floating Elements Around Card */}
        <div className="absolute top-1/3 left-1/5 w-3 h-3 bg-primary-300/50 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 right-1/5 w-4 h-4 bg-green-300/40 rounded-full animate-pulse animation-delay-2000"></div>
      </div>
    </div>
  );
};

export default IncidentCreationOverlay;
