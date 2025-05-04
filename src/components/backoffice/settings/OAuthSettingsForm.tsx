
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import OAuthProviderForm from './OAuthProviderForm';
import { toast } from '@/components/ui/sonner';
import { providerConfigs, OAuthProviderName, updateProviderConfig } from '@/utils/authProviders';

// Types
type OAuthProviderSettings = {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
};

interface OAuthSettings {
  google: OAuthProviderSettings;
  microsoft: OAuthProviderSettings;
  zoho: OAuthProviderSettings;
}

const OAuthSettingsForm = () => {
  const [oauthSettings, setOauthSettings] = useState<OAuthSettings>({
    google: {
      clientId: providerConfigs.google.clientId || "",
      clientSecret: "",
      enabled: true
    },
    microsoft: {
      clientId: providerConfigs.microsoft.clientId || "",
      clientSecret: "",
      enabled: true
    },
    zoho: {
      clientId: providerConfigs.zoho.clientId || "",
      clientSecret: "",
      enabled: true
    }
  });
  
  const handleOAuthSettingChange = (provider: OAuthProviderName, field: string, value: string | boolean) => {
    setOauthSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };
  
  // Function to save OAuth settings with proper error handling
  const saveOAuthSettings = () => {
    try {
      // Update provider configurations with the new settings
      Object.keys(oauthSettings).forEach((provider) => {
        const providerName = provider as OAuthProviderName;
        const settings = oauthSettings[providerName];
        
        updateProviderConfig(providerName, { 
          clientId: settings.clientId,
          // In a real implementation, you would securely handle the client secret
          // We're not storing it in the provider config for this demo
        });
      });
      
      toast.success("OAuth settings saved successfully");
    } catch (error) {
      console.error("Error saving OAuth settings:", error);
      toast.error("Failed to save OAuth settings");
    }
  };
  
  const providers = [
    {
      key: 'google' as OAuthProviderName,
      name: 'Google',
      helpLink: 'https://console.cloud.google.com/apis/credentials'
    },
    {
      key: 'microsoft' as OAuthProviderName,
      name: 'Microsoft',
      helpLink: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade'
    },
    {
      key: 'zoho' as OAuthProviderName,
      name: 'Zoho',
      helpLink: 'https://api-console.zoho.com/'
    }
  ];
  
  return (
    <div className="space-y-6">
      {providers.map((provider, index) => (
        <React.Fragment key={provider.key}>
          <OAuthProviderForm 
            providerName={provider.name}
            providerKey={provider.key}
            settings={oauthSettings[provider.key]}
            onSettingChange={(field, value) => 
              handleOAuthSettingChange(provider.key, field, value)
            }
            helpLink={provider.helpLink}
          />
          
          {index < providers.length - 1 && <Separator className="my-6" />}
        </React.Fragment>
      ))}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={saveOAuthSettings}>Save OAuth Settings</Button>
      </div>
    </div>
  );
};

export default OAuthSettingsForm;
