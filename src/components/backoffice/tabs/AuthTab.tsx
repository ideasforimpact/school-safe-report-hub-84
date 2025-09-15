
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
  showErrors?: boolean;
}

const AuthTab = ({ 
  formData, 
  onAddDomain, 
  onRemoveDomain,
  onAddSuperAdminDomain,
  onRemoveSuperAdminDomain,
  onProviderChange,
  showErrors = false
}: AuthTabProps) => {
  const hasProviders = Object.values(formData.authProviders || {}).some(v => v);

  return (
    <div className="space-y-4">
      {/* Allowed Domains Section */}
      <DomainInput 
        domains={formData.allowedDomains} 
        onAdd={onAddDomain} 
        onRemove={onRemoveDomain} 
      />
      {showErrors && (!formData.allowedDomains || formData.allowedDomains.length === 0) && (
        <p className="text-xs text-red-600">At least one allowed domain is required.</p>
      )}
      
      {/* Super Admin Allowed Domains Section */}
      <SuperAdminDomainInput
        domains={formData.superAdminAllowedDomains}
        onAdd={onAddSuperAdminDomain}
        onRemove={onRemoveSuperAdminDomain}
      />
      {showErrors && (!formData.superAdminAllowedDomains || formData.superAdminAllowedDomains.length === 0) && (
        <p className="text-xs text-red-600">At least one super admin domain is required.</p>
      )}
      
      {/* Authentication Providers */}
      <AuthProvidersSection 
        authProviders={formData.authProviders}
        onProviderChange={onProviderChange}
      />
      {showErrors && !hasProviders && (
        <p className="text-xs text-red-600">Enable at least one authentication provider.</p>
      )}
    </div>
  );
};

export default AuthTab;
