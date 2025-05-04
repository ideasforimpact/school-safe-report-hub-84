
import React from 'react';
import DomainInput from './DomainInput';
import AuthProvidersSection from './AuthProvidersSection';
import { OAuthProviderName } from '@/utils/authProviders';

interface AuthTabProps {
  formData: {
    allowedDomains: string[];
    authProviders: {
      [key in OAuthProviderName]?: boolean;
    };
  };
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
  onProviderChange: (provider: OAuthProviderName, value: boolean) => void;
}

const AuthTab = ({ 
  formData, 
  onAddDomain, 
  onRemoveDomain, 
  onProviderChange 
}: AuthTabProps) => {
  return (
    <div className="space-y-4">
      {/* Allowed Domains Section */}
      <DomainInput 
        domains={formData.allowedDomains} 
        onAdd={onAddDomain} 
        onRemove={onRemoveDomain} 
      />
      
      {/* Authentication Providers */}
      <AuthProvidersSection 
        authProviders={formData.authProviders}
        onProviderChange={onProviderChange}
      />
    </div>
  );
};

export default AuthTab;
