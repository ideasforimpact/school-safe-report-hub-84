
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const NotificationSettingsForm = () => {
  return (
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
  );
};

export default NotificationSettingsForm;
