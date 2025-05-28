
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EduSafeProvider } from '@/contexts/edusafe/EduSafeContext';
import ResourceUploadForm from '@/components/edusafe/ResourceUploadForm';

const UploadResourceContent = () => {
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center mb-8">
        <Button asChild variant="ghost" className="mr-4">
          <Link to="/edusafe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-left">Upload Resource</CardTitle>
        </CardHeader>
        
        <CardContent>
          <ResourceUploadForm />
        </CardContent>
      </Card>
    </div>
  );
};

const UploadResourcePage = () => {
  return (
    <Layout>
      <EduSafeProvider>
        <UploadResourceContent />
      </EduSafeProvider>
    </Layout>
  );
};

export default UploadResourcePage;
