
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RegionalSettingsForm = () => {
  return (
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
  );
};

export default RegionalSettingsForm;
