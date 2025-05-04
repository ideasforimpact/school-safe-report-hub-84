
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Types
type OAuthProviderSettings = {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
};

interface OAuthProviderFormProps {
  providerName: string;
  providerKey: string;
  settings: OAuthProviderSettings;
  onSettingChange: (field: string, value: string | boolean) => void;
  helpLink: string;
}

const OAuthProviderForm = ({ 
  providerName, 
  providerKey,
  settings, 
  onSettingChange,
  helpLink
}: OAuthProviderFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={`${providerKey}-enabled`}>{providerName} Authentication</Label>
          <p className="text-sm text-muted-foreground">
            Enable {providerName} as an authentication provider
          </p>
        </div>
        <Switch 
          id={`${providerKey}-enabled`}
          checked={settings.enabled}
          onCheckedChange={(checked) => onSettingChange('enabled', checked)}
        />
      </div>
      
      {settings.enabled && (
        <div className="space-y-4 border-l-2 pl-4 ml-2 border-gray-100">
          <div className="space-y-2">
            <Label htmlFor={`${providerKey}-client-id`}>Client ID</Label>
            <Input 
              id={`${providerKey}-client-id`}
              value={settings.clientId}
              onChange={(e) => onSettingChange('clientId', e.target.value)}
              placeholder={`Your ${providerName} OAuth Client ID`}
            />
            {providerKey === 'google' && (
              <p className="text-xs text-muted-foreground">
                Get this from Google Cloud Console
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${providerKey}-client-secret`}>Client Secret</Label>
            <Input 
              id={`${providerKey}-client-secret`}
              type="password"
              value={settings.clientSecret}
              onChange={(e) => onSettingChange('clientSecret', e.target.value)}
              placeholder={`Your ${providerName} OAuth Client Secret`}
            />
            {providerKey === 'google' && (
              <p className="text-xs text-muted-foreground">
                This value will be stored securely
              </p>
            )}
          </div>
          
          <p className="text-xs text-blue-600">
            <a href={helpLink} target="_blank" rel="noopener noreferrer">
              How to create {providerName} OAuth credentials
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default OAuthProviderForm;
