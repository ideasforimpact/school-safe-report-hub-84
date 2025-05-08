
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedResolutionSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedResolutionSection: React.FC<EnhancedResolutionSectionProps> = ({ form }) => {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
      <FormField
        control={form.control}
        name="resolution"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <FormLabel className="text-lg font-medium">What action or resolution do you expect?</FormLabel>
            </div>
            <FormControl>
              <Textarea
                placeholder="Please describe the resolution you are seeking"
                className="min-h-[100px] bg-gray-50 transition-colors focus:bg-white"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500 mt-1">
              Optional. Tell us what outcome you hope to achieve.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedResolutionSection;
