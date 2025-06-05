
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomForms } from '@/hooks/useCustomForms';
import ConditionalFormRenderer from '@/components/forms/ConditionalFormRenderer';

const FormPreviewPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { forms, loading } = useCustomForms();
  
  const form = forms.find(f => f.id === formId);

  // Dummy function for preview mode
  const handlePreviewSubmit = () => {
    // This won't be called in preview mode, but satisfies TypeScript
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex items-center mb-8">
            <Button asChild variant="ghost" className="mr-4">
              <Link to="/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500">Loading form...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex items-center mb-8">
            <Button asChild variant="ghost" className="mr-4">
              <Link to="/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>
          
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Form Not Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              The form you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/settings">Return to Settings</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" className="mr-4">
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{form.title}</CardTitle>
                {form.description && (
                  <p className="text-gray-600 mt-2">{form.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Preview Mode</div>
                <div className="text-xs text-gray-400">
                  {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <ConditionalFormRenderer 
              fields={form.fields} 
              onSubmit={handlePreviewSubmit}
              isPreview={true}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FormPreviewPage;
