
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const SecuritySettingsForm = () => {
  return (
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
  );
};

export default SecuritySettingsForm;
