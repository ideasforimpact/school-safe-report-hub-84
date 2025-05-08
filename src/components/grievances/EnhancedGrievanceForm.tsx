
import React from 'react';
import { Form } from '@/components/ui/form';
import { useEnhancedGrievanceForm } from './hooks/useEnhancedGrievanceForm';

// Importing refactored components
import EnhancedSubmitterInfoSection from './form-sections/EnhancedSubmitterInfoSection';
import EnhancedContactInfoSection from './form-sections/EnhancedContactInfoSection';
import EnhancedGrievanceHeadingSection from './form-sections/EnhancedGrievanceHeadingSection';
import EnhancedDescriptionSection from './form-sections/EnhancedDescriptionSection';
import EnhancedResolutionSection from './form-sections/EnhancedResolutionSection';
import EnhancedContactPreferenceSection from './form-sections/EnhancedContactPreferenceSection';
import EnhancedSubmitButton from './form-sections/EnhancedSubmitButton';

interface EnhancedGrievanceFormProps {
  schoolName?: string;
}

const EnhancedGrievanceForm: React.FC<EnhancedGrievanceFormProps> = ({ schoolName = "School Grievance Portal" }) => {
  const { form, isSubmitting, onSubmit } = useEnhancedGrievanceForm(schoolName);

  return (
    <div className="animate-fade-in">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            {/* Name Section */}
            <EnhancedSubmitterInfoSection form={form} />

            {/* Contact Information */}
            <EnhancedContactInfoSection form={form} />

            {/* Grievance Heading */}
            <EnhancedGrievanceHeadingSection form={form} />

            {/* Description */}
            <EnhancedDescriptionSection form={form} />

            {/* Resolution */}
            <EnhancedResolutionSection form={form} />

            {/* Contact Preference */}
            <EnhancedContactPreferenceSection form={form} />
          </div>

          {/* Submit Button */}
          <EnhancedSubmitButton isSubmitting={isSubmitting} />
        </form>
      </Form>
    </div>
  );
};

export default EnhancedGrievanceForm;
