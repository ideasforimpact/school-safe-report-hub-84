
import React from 'react';
import { User } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedGrievanceFormValues } from '../hooks/useEnhancedGrievanceForm';

interface EnhancedSubmitterInfoSectionProps {
  form: UseFormReturn<EnhancedGrievanceFormValues>;
}

const EnhancedSubmitterInfoSection: React.FC<EnhancedSubmitterInfoSectionProps> = ({ form }) => {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <FormLabel className="text-lg font-medium">Name of the Person Raising the Complaint</FormLabel>
            </div>
            <FormControl>
              <Input
                placeholder="You may submit anonymously"
                {...field}
                className="bg-gray-50 transition-colors focus:bg-white"
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500 mt-1">
              Optional. Your identity will be protected if provided.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedSubmitterInfoSection;
