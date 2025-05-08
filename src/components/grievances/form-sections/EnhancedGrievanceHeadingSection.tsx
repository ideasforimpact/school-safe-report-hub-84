
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedGrievanceHeadingSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedGrievanceHeadingSection: React.FC<EnhancedGrievanceHeadingSectionProps> = ({ form }) => {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
      <FormField
        control={form.control}
        name="heading"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <FormLabel className="text-sm font-medium">Grievance Heading</FormLabel>
            </div>
            <FormControl>
              <Input
                placeholder="Brief title or subject of your grievance"
                {...field}
                className="bg-gray-50 transition-colors focus:bg-white"
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500 mt-1">
              Optional. Provide a concise title for your grievance.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedGrievanceHeadingSection;
