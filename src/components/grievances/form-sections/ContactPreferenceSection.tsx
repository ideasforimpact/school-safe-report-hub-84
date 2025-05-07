
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ContactPreferenceSectionProps {
  preferContact: string;
  setPreferContact: (value: string) => void;
}

const ContactPreferenceSection: React.FC<ContactPreferenceSectionProps> = ({
  preferContact,
  setPreferContact
}) => {
  return (
    <div className="pt-4">
      <RadioGroup 
        value={preferContact} 
        onValueChange={setPreferContact}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Yes" id="contact-yes" />
          <Label htmlFor="contact-yes" className="font-normal">I would like to be contacted about this grievance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="No" id="contact-no" />
          <Label htmlFor="contact-no" className="font-normal">No follow-up needed</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ContactPreferenceSection;
