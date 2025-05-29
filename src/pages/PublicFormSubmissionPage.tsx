
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicForm } from '@/hooks/usePublicForm';
import ConditionalFormRenderer from '@/components/forms/ConditionalFormRenderer';
import PublicLayout from '@/components/layout/PublicLayout';
import { AlertCircle } from 'lucide-react';

const PublicFormSubmissionPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form, loading, error } = usePublicForm(formId);

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

  const handleFormSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    // TODO: Implement form submission logic
    alert('Form submitted successfully! (This is a placeholder - implementation needed)');
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
            />
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicFormSubmissionPage;
