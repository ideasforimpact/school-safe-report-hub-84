
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BulkTemplateUpload from '@/components/backoffice/assessments/BulkTemplateUpload';
import TemplateLibrary from '@/components/backoffice/assessments/TemplateLibrary';
import { useAuth } from '@/contexts/auth/AuthContext';

const AssessmentTemplatesManagementPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold">Assessment Templates Management</h1>
          </div>
        </div>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="library" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Template Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Template Library</CardTitle>
                <CardDescription>
                  Manage and distribute assessment templates to client institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateLibrary />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Templates</CardTitle>
                <CardDescription>
                  Upload multiple assessment templates at once using JSON or CSV format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BulkTemplateUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BackofficeLayout>
  );
};

export default AssessmentTemplatesManagementPage;
