
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Scale, TestTube, Shield } from 'lucide-react';
import DocumentTypeSelector from '../DocumentTypeSelector';
import DocumentForm from './DocumentForm';
import { FileItem } from '@/types/fileTypes';

interface DocumentTabsProps {
  employeeId: string;
  selectedTypeId: string | null;
  onTypeChange: (typeId: string) => void;
  files: FileItem[];
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  employeeId,
  selectedTypeId,
  onTypeChange,
  files,
  isSubmitting,
  onSubmit,
  onCancel,
  onFileUploaded
}) => {
  const [activeTab, setActiveTab] = useState('regular');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset selected type when switching tabs
    if (value !== 'regular') {
      onTypeChange('');
    }
  };

  const handleBankStatementAnalysis = () => {
    // Handle bank statement analysis submission
    console.log('Bank Statement Analysis submitted');
  };

  const handleCourtCaseCheck = () => {
    // Handle court case check
    console.log('Court Case Check initiated');
  };

  const handleDrugTest = () => {
    // Handle drug test submission
    console.log('Drug Test submitted');
  };

  const handlePoliceVerification = () => {
    // Handle police verification submission
    console.log('Police Verification submitted');
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="regular">Documents</TabsTrigger>
        <TabsTrigger value="bank-analysis">Bank Statement Analysis</TabsTrigger>
        <TabsTrigger value="court-case">Court Case Check</TabsTrigger>
        <TabsTrigger value="drug-test">Drug Test</TabsTrigger>
        <TabsTrigger value="police-verification">Police Verification</TabsTrigger>
      </TabsList>

      <TabsContent value="regular" className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Select Document Type <span className="text-red-500">*</span></h4>
          <DocumentTypeSelector 
            selectedTypeId={selectedTypeId} 
            onChange={onTypeChange} 
          />
          {!selectedTypeId && <p className="text-xs text-red-500 mt-2">Please select a document type</p>}
        </div>

        {selectedTypeId && (
          <DocumentForm
            employeeId={employeeId}
            selectedTypeId={selectedTypeId}
            files={files}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onFileUploaded={onFileUploaded}
          />
        )}
      </TabsContent>

      <TabsContent value="bank-analysis" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Bank Statement Analysis</h3>
              <p className="text-gray-600 mb-4 text-center">
                Drag and drop your PDF bank statement file here
              </p>
              <div className="text-sm text-red-500 mb-4">* Required field</div>
              <Button 
                onClick={handleBankStatementAnalysis}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Bank Statement
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="court-case" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <Scale className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Court Case Check</h3>
              <p className="text-gray-600 mb-6 text-center">
                Check for any court cases through E-Court system
              </p>
              <div className="text-sm text-red-500 mb-4">* Required field</div>
              <Button 
                onClick={handleCourtCaseCheck}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Scale className="h-4 w-4 mr-2" />
                Check for Court Cases through E Court
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="drug-test" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <TestTube className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Drug Test</h3>
              <p className="text-gray-600 mb-6 text-center">
                Submit drug test verification request
              </p>
              <div className="text-sm text-red-500 mb-4">* Required field</div>
              <Button 
                onClick={handleDrugTest}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Submit for Drug Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="police-verification" className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <Shield className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Police Verification</h3>
              <p className="text-gray-600 mb-6 text-center">
                Submit for police verification check
              </p>
              <div className="text-sm text-red-500 mb-4">* Required field</div>
              <Button 
                onClick={handlePoliceVerification}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Submit for Police Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DocumentTabs;
