
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle } from 'lucide-react';

interface ResolutionSectionProps {
  resolution: string;
  setResolution: (value: string) => void;
}

const ResolutionSection: React.FC<ResolutionSectionProps> = ({
  resolution,
  setResolution
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-5 w-5 text-gray-500" />
        <Label htmlFor="resolution">What action or resolution do you expect?</Label>
      </div>
      <div>
        <Textarea
          id="resolution"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Please describe the resolution you are seeking"
          rows={3}
        />
      </div>
    </>
  );
};

export default ResolutionSection;
