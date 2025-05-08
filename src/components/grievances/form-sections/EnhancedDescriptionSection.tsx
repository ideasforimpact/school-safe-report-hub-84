
import React from 'react';
import { FileText } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedDescriptionSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedDescriptionSection: React.FC<EnhancedDescriptionSectionProps> = ({ form }) => {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <FormLabel className="text-lg font-medium">Description of your grievance</FormLabel>
            </div>
            <FormControl>
              <Textarea
                placeholder="Please provide details about your grievance"
                className="min-h-[150px] bg-gray-50 transition-colors focus:bg-white"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <span className="text-amber-500">•</span> Required field. Include all relevant details.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedDescriptionSection;
