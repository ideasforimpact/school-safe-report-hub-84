
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface GeneralSettingsFormProps {
  settings: {
    siteName: string;
    supportEmail: string;
    notificationsEnabled: boolean;
    maintenanceMode: boolean;
    autoLogout: boolean;
  };
  onSettingChange: (key: string, value: string | boolean) => void;
}

const GeneralSettingsForm = ({ settings, onSettingChange }: GeneralSettingsFormProps) => {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input 
            id="siteName"
            value={settings.siteName}
            onChange={(e) => onSettingChange('siteName', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="supportEmail">Support Email</Label>
          <Input 
            id="supportEmail"
            type="email"
            value={settings.supportEmail}
            onChange={(e) => onSettingChange('supportEmail', e.target.value)}
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
            checked={settings.notificationsEnabled}
            onCheckedChange={(checked) => onSettingChange('notificationsEnabled', checked)}
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
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => onSettingChange('maintenanceMode', checked)}
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
            checked={settings.autoLogout}
            onCheckedChange={(checked) => onSettingChange('autoLogout', checked)}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </form>
  );
};

export default GeneralSettingsForm;
