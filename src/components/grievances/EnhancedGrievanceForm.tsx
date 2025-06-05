
import React from 'react';
import { Form } from '@/components/ui/form';
import { useEnhancedGrievanceForm } from './hooks/useEnhancedGrievanceForm';
import SimpleCaptcha from '@/components/captcha/SimpleCaptcha';

// Import form sections
import EnhancedSubmitterInfoSection from './form-sections/EnhancedSubmitterInfoSection';
import EnhancedGrievanceHeadingSection from './form-sections/EnhancedGrievanceHeadingSection';
import EnhancedDescriptionSection from './form-sections/EnhancedDescriptionSection';
import EnhancedResolutionSection from './form-sections/EnhancedResolutionSection';
import EnhancedContactPreferenceSection from './form-sections/EnhancedContactPreferenceSection';
import EnhancedSubmitButton from './form-sections/EnhancedSubmitButton';
import { useState } from 'react';

interface EnhancedGrievanceFormProps {
  schoolName?: string;
}

const EnhancedGrievanceForm: React.FC<EnhancedGrievanceFormProps> = ({ 
  schoolName = "School Grievance Portal" 
}) => {
  const { form, isSubmitting, onSubmit } = useEnhancedGrievanceForm(schoolName);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const handleSubmit = (values: any) => {
    if (!isCaptchaVerified) {
      // Show error for CAPTCHA verification
      form.setError('root', {
        type: 'manual',
        message: 'Please verify the CAPTCHA before submitting.'
      });
      return;
    }
    
    // Clear any previous CAPTCHA errors
    form.clearErrors('root');
    onSubmit(values);
  };

  const handleCaptchaVerify = (isValid: boolean) => {
    setIsCaptchaVerified(isValid);
    if (isValid) {
      form.clearErrors('root');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
          <EnhancedSubmitterInfoSection control={form.control} />
          <EnhancedGrievanceHeadingSection control={form.control} />
          <EnhancedDescriptionSection control={form.control} />
          <EnhancedResolutionSection control={form.control} />
          <EnhancedContactPreferenceSection control={form.control} />
          
          {/* CAPTCHA Verification */}
          <SimpleCaptcha 
            onVerify={handleCaptchaVerify}
            isSubmitting={isSubmitting}
          />
          
          {/* Show CAPTCHA error if exists */}
          {form.formState.errors.root && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {form.formState.errors.root.message}
            </div>
          )}
          
          <EnhancedSubmitButton isSubmitting={isSubmitting || !isCaptchaVerified} />
        </div>
      </form>
    </Form>
  );
};

export default EnhancedGrievanceForm;
