
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicForm } from '@/hooks/usePublicForm';
import ConditionalFormRenderer from '@/components/forms/ConditionalFormRenderer';
import PublicLayout from '@/components/layout/PublicLayout';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isCaptchaVerified, requireCaptchaVerification } from '@/utils/captchaUtils';

const PublicFormSubmissionPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form, loading, error } = usePublicForm(formId);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check CAPTCHA verification on component mount
  useEffect(() => {
    if (!isCaptchaVerified()) {
      // Redirect to CAPTCHA verification page
      navigate(requireCaptchaVerification(formId, 'form'));
    }
  }, [formId, navigate]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500">Loading form...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (error || !form) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Form Not Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {error || 'The form you\'re looking for doesn\'t exist, is not active, or has been removed.'}
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Don't render form if CAPTCHA is not verified
  if (!isCaptchaVerified()) {
    return null; // Component will redirect via useEffect
  }

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', data);

      // Convert form data to responses array format
      const responses = Object.entries(data).map(([fieldId, value]) => {
        const field = form.fields.find(f => f.id === fieldId);
        return {
          field_id: fieldId,
          field_label: field?.label || 'Unknown Field',
          field_type: field?.type || 'text_input',
          value: value
        };
      });

      // Call the submit-form edge function
      const { data: result, error } = await supabase.functions.invoke('submit-form', {
        body: {
          form_id: formId,
          responses: responses,
          submitter_name: data.submitter_name || null,
          submitter_email: data.submitter_email || null,
          comments: data.comments || null
        }
      });

      if (error) {
        console.error('Form submission error:', error);
        toast({
          title: "Error",
          description: "Failed to submit form. Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        console.error('Form submission failed:', result.error);
        toast({
          title: "Error", 
          description: result.error || "Failed to submit form. Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Form submitted successfully:', result.data);
      
      // Redirect to success page after successful submission
      navigate('/public-form-submission-success');

    } catch (err) {
      console.error('Unexpected error during form submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}
          </CardHeader>
          
          <CardContent>
            <ConditionalFormRenderer 
              fields={form.fields} 
              onSubmit={handleFormSubmit}
              isPreview={false}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicFormSubmissionPage;
