
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssessmentStatus } from "@/types/assessmentTypes";

interface StatusSettingsSectionProps {
  status: AssessmentStatus;
  setStatus: (status: AssessmentStatus) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

const StatusSettingsSection = ({
  status,
  setStatus,
  isActive,
  setIsActive,
}: StatusSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={status} 
          onValueChange={(value: AssessmentStatus) => setStatus(value)}
          disabled={isActive}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2 py-2">
        <Checkbox 
          id="active" 
          checked={isActive} 
          onCheckedChange={(checked) => {
            setIsActive(checked as boolean);
            if (checked) {
              setStatus('active');
            }
          }}
        />
        <Label htmlFor="active">Make this assessment active</Label>
      </div>
    </div>
  );
};

export default StatusSettingsSection;
