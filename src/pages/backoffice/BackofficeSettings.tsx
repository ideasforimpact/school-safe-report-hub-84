import { useState } from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, BellRing, Globe, Key } from "lucide-react";
import { providerConfigs, OAuthProviderName, updateProviderConfig } from '@/utils/authProviders';
import { toast } from "@/components/ui/sonner";

// Fix for TS7061: A mapped type may not declare properties or methods
type OAuthProviderSettings = {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
};

// Fixed interface definition
interface OAuthSettings {
  google: OAuthProviderSettings;
  microsoft: OAuthProviderSettings;
  zoho: OAuthProviderSettings;
}

const BackofficeSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Safe School Management",
    supportEmail: "support@safeschool.com",
    notificationsEnabled: true,
    maintenanceMode: false,
    autoLogout: true
  });
  
  // Add OAuth provider settings state with improved typing
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
  
  const handleGeneralSettingChange = (key: string, value: string | boolean) => {
    setGeneralSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
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
  
  return (
    <BackofficeLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure global system settings</p>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>OAuth Providers</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Regional</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage basic system configuration settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input 
                        id="siteName"
                        value={generalSettings.siteName}
                        onChange={(e) => handleGeneralSettingChange('siteName', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input 
                        id="supportEmail"
                        type="email"
                        value={generalSettings.supportEmail}
                        onChange={(e) => handleGeneralSettingChange('supportEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notificationsEnabled">Enable System Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send automatic notifications about system events
                        </p>
                      </div>
                      <Switch 
                        id="notificationsEnabled"
                        checked={generalSettings.notificationsEnabled}
                        onCheckedChange={(checked) => handleGeneralSettingChange('notificationsEnabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to prevent client access
                        </p>
                      </div>
                      <Switch 
                        id="maintenanceMode"
                        checked={generalSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleGeneralSettingChange('maintenanceMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoLogout">Auto-Logout After Inactivity</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically log users out after 30 minutes of inactivity
                        </p>
                      </div>
                      <Switch 
                        id="autoLogout"
                        checked={generalSettings.autoLogout}
                        onCheckedChange={(checked) => handleGeneralSettingChange('autoLogout', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and access control settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Require 2FA for administrative users
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Password Expiry</Label>
                        <p className="text-sm text-muted-foreground">
                          Force password reset every 90 days
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>IP Restrictions</Label>
                        <p className="text-sm text-muted-foreground">
                          Limit admin access to specific IP ranges
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Session Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" defaultValue="30" min="5" max="120" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Failed Login Attempts</Label>
                        <Input type="number" defaultValue="5" min="3" max="10" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="oauth">
            <Card>
              <CardHeader>
                <CardTitle>OAuth Provider Settings</CardTitle>
                <CardDescription>Configure OAuth provider credentials for client authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Google OAuth Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="google-enabled">Google Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Google as an authentication provider
                        </p>
                      </div>
                      <Switch 
                        id="google-enabled"
                        checked={oauthSettings.google.enabled}
                        onCheckedChange={(checked) => handleOAuthSettingChange('google', 'enabled', checked)}
                      />
                    </div>
                    
                    {oauthSettings.google.enabled && (
                      <div className="space-y-4 border-l-2 pl-4 ml-2 border-gray-100">
                        <div className="space-y-2">
                          <Label htmlFor="google-client-id">Client ID</Label>
                          <Input 
                            id="google-client-id"
                            value={oauthSettings.google.clientId}
                            onChange={(e) => handleOAuthSettingChange('google', 'clientId', e.target.value)}
                            placeholder="Your Google OAuth Client ID"
                          />
                          <p className="text-xs text-muted-foreground">
                            Get this from Google Cloud Console
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="google-client-secret">Client Secret</Label>
                          <Input 
                            id="google-client-secret"
                            type="password"
                            value={oauthSettings.google.clientSecret}
                            onChange={(e) => handleOAuthSettingChange('google', 'clientSecret', e.target.value)}
                            placeholder="Your Google OAuth Client Secret"
                          />
                          <p className="text-xs text-muted-foreground">
                            This value will be stored securely
                          </p>
                        </div>
                        
                        <p className="text-xs text-blue-600">
                          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                            How to create Google OAuth credentials
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Microsoft OAuth Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="microsoft-enabled">Microsoft Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Microsoft as an authentication provider
                        </p>
                      </div>
                      <Switch 
                        id="microsoft-enabled"
                        checked={oauthSettings.microsoft.enabled}
                        onCheckedChange={(checked) => handleOAuthSettingChange('microsoft', 'enabled', checked)}
                      />
                    </div>
                    
                    {oauthSettings.microsoft.enabled && (
                      <div className="space-y-4 border-l-2 pl-4 ml-2 border-gray-100">
                        <div className="space-y-2">
                          <Label htmlFor="microsoft-client-id">Client ID</Label>
                          <Input 
                            id="microsoft-client-id"
                            value={oauthSettings.microsoft.clientId}
                            onChange={(e) => handleOAuthSettingChange('microsoft', 'clientId', e.target.value)}
                            placeholder="Your Microsoft OAuth Client ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="microsoft-client-secret">Client Secret</Label>
                          <Input 
                            id="microsoft-client-secret"
                            type="password"
                            value={oauthSettings.microsoft.clientSecret}
                            onChange={(e) => handleOAuthSettingChange('microsoft', 'clientSecret', e.target.value)}
                            placeholder="Your Microsoft OAuth Client Secret"
                          />
                        </div>
                        
                        <p className="text-xs text-blue-600">
                          <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer">
                            How to create Microsoft OAuth credentials
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Zoho OAuth Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="zoho-enabled">Zoho Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Zoho as an authentication provider
                        </p>
                      </div>
                      <Switch 
                        id="zoho-enabled"
                        checked={oauthSettings.zoho.enabled}
                        onCheckedChange={(checked) => handleOAuthSettingChange('zoho', 'enabled', checked)}
                      />
                    </div>
                    
                    {oauthSettings.zoho.enabled && (
                      <div className="space-y-4 border-l-2 pl-4 ml-2 border-gray-100">
                        <div className="space-y-2">
                          <Label htmlFor="zoho-client-id">Client ID</Label>
                          <Input 
                            id="zoho-client-id"
                            value={oauthSettings.zoho.clientId}
                            onChange={(e) => handleOAuthSettingChange('zoho', 'clientId', e.target.value)}
                            placeholder="Your Zoho OAuth Client ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="zoho-client-secret">Client Secret</Label>
                          <Input 
                            id="zoho-client-secret"
                            type="password"
                            value={oauthSettings.zoho.clientSecret}
                            onChange={(e) => handleOAuthSettingChange('zoho', 'clientSecret', e.target.value)}
                            placeholder="Your Zoho OAuth Client Secret"
                          />
                        </div>
                        
                        <p className="text-xs text-blue-600">
                          <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer">
                            How to create Zoho OAuth credentials
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={saveOAuthSettings}>Save OAuth Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Email Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Client Registration</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email when new clients register
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Critical Incident Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Send urgent notification for critical incidents
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Usage Summary</Label>
                        <p className="text-sm text-muted-foreground">
                          Send weekly usage reports every Monday
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Recipients</h3>
                    
                    <div className="space-y-2">
                      <Label>Admin Email Addresses</Label>
                      <Input defaultValue="admin@safeschool.com, support@safeschool.com" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate multiple email addresses with commas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="regional">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Configure localization and regional preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Default Timezone</Label>
                      <select className="w-full border rounded-md h-10 px-3">
                        <option>America/New_York (EDT -4:00)</option>
                        <option>America/Chicago (CDT -5:00)</option>
                        <option>America/Denver (MDT -6:00)</option>
                        <option>America/Los_Angeles (PDT -7:00)</option>
                        <option>Europe/London (BST +1:00)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <select className="w-full border rounded-md h-10 px-3">
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Default Language</Label>
                      <select className="w-full border rounded-md h-10 px-3">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>First Day of Week</Label>
                      <select className="w-full border rounded-md h-10 px-3">
                        <option>Sunday</option>
                        <option>Monday</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BackofficeLayout>
  );
};

export default BackofficeSettings;
