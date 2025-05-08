
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedContactPreferenceSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedContactPreferenceSection: React.FC<EnhancedContactPreferenceSectionProps> = ({ form }) => {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
      <FormField
        control={form.control}
        name="preferContact"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-lg font-medium">Would you like to be contacted about this grievance?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="contact-yes" />
                  <FormLabel htmlFor="contact-yes" className="font-normal">Yes, please contact me</FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="contact-no" />
                  <FormLabel htmlFor="contact-no" className="font-normal">No follow-up needed</FormLabel>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedContactPreferenceSection;
