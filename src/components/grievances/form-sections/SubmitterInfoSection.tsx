
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Phone } from 'lucide-react';

interface SubmitterInfoSectionProps {
  name: string;
  setName: (value: string) => void;
  contactInfo: string;
  setContactInfo: (value: string) => void;
  errors: Record<string, string>;
}

const SubmitterInfoSection: React.FC<SubmitterInfoSectionProps> = ({
  name,
  setName,
  contactInfo,
  setContactInfo,
  errors
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <User className="h-5 w-5 text-gray-500" />
        <Label htmlFor="name" className="text-lg font-medium">Name of the Person Raising the Complaint <span className="text-red-500">*</span></Label>
      </div>
      <div>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={errors.name ? 'border-red-500' : ''}
          placeholder="Your name will be kept highly confidential"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>
      
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Phone className="h-5 w-5 text-gray-500" />
        <Label htmlFor="contactInfo">Contact Information</Label>
      </div>
      <div>
        <Input
          id="contactInfo"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="Email or phone number (only if follow-up is required)"
        />
      </div>
    </>
  );
};

export default SubmitterInfoSection;
