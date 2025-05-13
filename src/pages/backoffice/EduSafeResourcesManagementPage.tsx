
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BulkResourceUpload from '@/components/backoffice/edusafe/BulkResourceUpload';
import ResourcesLibrary from '@/components/backoffice/edusafe/ResourcesLibrary';
import { useAuth } from '@/contexts/auth/AuthContext';

const EduSafeResourcesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSaasOwner } = useAuth();

  if (!isSaasOwner) {
    navigate('/dashboard');
    return null;
  }

  return (
    <BackofficeLayout>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">EduSafe Resources Management</h1>
          </div>
        </div>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="library" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Resource Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Resource Library</CardTitle>
                <CardDescription>
                  Manage and distribute educational safety resources to client institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResourcesLibrary />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Resources</CardTitle>
                <CardDescription>
                  Upload multiple educational resources at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BulkResourceUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BackofficeLayout>
  );
};

export default EduSafeResourcesManagementPage;
