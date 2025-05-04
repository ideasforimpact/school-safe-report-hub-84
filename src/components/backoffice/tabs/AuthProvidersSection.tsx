
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthProviderName } from '@/utils/authProviders';

interface AuthProvidersSectionProps {
  authProviders: {
    [key in OAuthProviderName]?: boolean;
  };
  onProviderChange: (provider: OAuthProviderName, value: boolean) => void;
}

const AuthProvidersSection = ({ authProviders, onProviderChange }: AuthProvidersSectionProps) => {
  return (
    <div className="space-y-2 border-t pt-4 mt-4">
      <label className="font-medium">Authentication Providers</label>
      <p className="text-sm text-gray-500">
        Select which authentication providers this client can use for login
      </p>
      
      <div className="grid grid-cols-1 gap-2 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="google-auth"
            checked={authProviders.google}
            onCheckedChange={(checked) => 
              onProviderChange('google', checked === true)
            }
          />
          <label 
            htmlFor="google-auth"
            className="text-sm font-medium leading-none"
          >
            Google
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="microsoft-auth"
            checked={authProviders.microsoft}
            onCheckedChange={(checked) => 
              onProviderChange('microsoft', checked === true)
            }
          />
          <label 
            htmlFor="microsoft-auth"
            className="text-sm font-medium leading-none"
          >
            Microsoft
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="zoho-auth"
            checked={authProviders.zoho}
            onCheckedChange={(checked) => 
              onProviderChange('zoho', checked === true)
            }
          />
          <label 
            htmlFor="zoho-auth"
            className="text-sm font-medium leading-none"
          >
            Zoho
          </label>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Note: You will need to configure OAuth credentials for each provider in the system settings.
      </p>
    </div>
  );
};

export default AuthProvidersSection;
