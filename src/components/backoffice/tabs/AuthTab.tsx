
import React from 'react';
import DomainInput from './DomainInput';
import SuperAdminDomainInput from './SuperAdminDomainInput';
import AuthProvidersSection from './AuthProvidersSection';
import { OAuthProviderName } from '@/utils/authProviders';

interface AuthTabProps {
  formData: {
    allowedDomains: string[];
    superAdminAllowedDomains: string[];
    authProviders: {
      [key in OAuthProviderName]?: boolean;
    };
  };
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
  onAddSuperAdminDomain: (domain: string) => void;
  onRemoveSuperAdminDomain: (domain: string) => void;
  onProviderChange: (provider: OAuthProviderName, value: boolean) => void;
}

const AuthTab = ({ 
  formData, 
  onAddDomain, 
  onRemoveDomain,
  onAddSuperAdminDomain,
  onRemoveSuperAdminDomain,
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
      
      {/* Super Admin Allowed Domains Section */}
      <SuperAdminDomainInput
        domains={formData.superAdminAllowedDomains}
        onAdd={onAddSuperAdminDomain}
        onRemove={onRemoveSuperAdminDomain}
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
