
import React from 'react';
import { Phone } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedContactInfoSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedContactInfoSection: React.FC<EnhancedContactInfoSectionProps> = ({ form }) => {
  const preferContact = useWatch({
    control: form.control,
    name: 'preferContact',
  });
  
  const isRequired = preferContact === 'Yes';
  
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
      <FormField
        control={form.control}
        name="contactInfo"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-primary" />
              <FormLabel className="text-sm font-medium">
                Contact Information{isRequired && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            </div>
            <FormControl>
              <Input
                placeholder={isRequired ? "Email or phone number (required)" : "Email or phone number (only if follow-up is required)"}
                {...field}
                className="bg-gray-50 transition-colors focus:bg-white"
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500 mt-1">
              {isRequired 
                ? "Required. We'll use this to contact you about your grievance." 
                : "Optional. Only needed if you want us to contact you about this grievance."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedContactInfoSection;
